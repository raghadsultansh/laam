"""
Step 5 - Run Claude Sonnet judge on generated rows.

The judge catches issues the Python validator cannot: hallucinated values,
wrong arithmetic, weak analysis, subtle citation leakage. It runs on a
subset of rows - not every row - to keep costs low.

Typical usage:
  # Calibration: judge all 500 accepted rows to tune the judge prompt
  python 05_judge.py --input batch_outputs/accepted_500.csv

  # Production: judge failed rows + a random sample of accepted rows
  python 05_judge.py --input batch_outputs/accepted_500.csv --sample 50
  python 05_judge.py --input failed_rows/failed_500.csv

  # Judge only rows with soft warnings (risky rows)
  python 05_judge.py --input batch_outputs/accepted_500.csv --risky-only

Outputs:
  validation_reports/judge_<tag>.csv   per-row verdicts
  failed_rows/judge_failed_<tag>.csv   rows the judge rejected (feed to 06_fix.py)
"""

import argparse
import json
import time
import pandas as pd
from pathlib import Path
from tqdm import tqdm
import anthropic

from config import (
    ANTHROPIC_API_KEY, JUDGE_MODEL, STOP_TOKEN,
    VALIDATION_REPORTS_DIR, FAILED_ROWS_DIR,
)

JUDGE_DELAY = 1.0  # seconds between Sonnet calls

JUDGE_PROMPT_TEMPLATE = """\
You are auditing a generated reasoning_target for a financial reasoning dataset.

Your job: decide whether this reasoning_target is valid supervised fine-tuning data \
for the given row.

Evaluate all 8 checks. Be strict but fair - flag real problems, not style preferences.

1. VALUES GROUNDING: Does Values used contain only values that appear in the provided \
table/text? Flag any invented numbers, metrics, companies, or dates not in the source.

2. ANSWER MATCH: Does the Final Answer match the gold answer? Minor phrasing differences \
are fine. Do not fail harmless formatting differences such as comma separators \
("4,572" vs "4572"), currency symbols when the value is otherwise correct, or a \
scale/unit word or symbol that is supplied by the row's scale field ("thousand", \
"million", "percent", "%"). The generator is required to write a complete sentence, \
so do not fail merely because the gold answer is embedded in a complete sentence, \
uses different casing, uses passive voice, or is a faithful paraphrase. For span and \
multi-span answers, pass if all gold answer components are present and no incorrect \
extra facts are added. Do fail wrong numeric values, missing answer components, \
wrong units not supported by the scale field, materially different meaning, or \
incomplete answers.

3. ARITHMETIC CORRECTNESS: If answer_type is arithmetic, verify the calculation in the \
Calculation section is mathematically correct. Check the actual math.

4. ANALYSIS QUALITY: If answer_type is arithmetic, does the Analysis section give a \
genuine 1-2 sentence interpretation grounded only in the provided row and the \
computed result? For financial metrics, this should be a financial interpretation. \
For operational or non-financial metrics (for example tonnes, shares, units, rates, \
or counts), a grounded operational/domain interpretation is acceptable. "The value \
increased" with no context is weak, but a concise directional interpretation is \
acceptable when the source provides limited context and the wording stays grounded. \
Causal explanations, business drivers, accounting reasons, strategic motives, \
market conditions, acquisitions, impairments, or performance claims are invalid \
unless they are explicitly supported by the provided table/text. If the source only \
supports a numeric comparison, the analysis should stay descriptive and say what the \
computed change means without inventing why it happened.

5. TEMPLATE COMPLIANCE: Does the reasoning_target have all required sections in order: \
"Reasoning & Calculations:", "Values used:", "Calculation:", "Analysis:", "Final Answer:"?

6. NON-ARITHMETIC ANALYSIS RULE: If answer_type is span, multi-span, or count, the \
Analysis section must contain exactly "No financial analysis required." - nothing else. \
Flag if it contains real analysis OR if the Analysis section is missing entirely. \
For these non-arithmetic answer types, the Calculation section may say exactly \
"No numerical calculation required." as required by the generator template; do not \
fail that wording.

7. CITATION CLEAN: Does it avoid source-location language not present in the question \
or gold answer? \
Flag phrases like "from the table", "in paragraph", "on page", "according to", \
"from the source" if they were NOT in the original question and are NOT required \
by the gold answer. Do not fail wording that is literally part of the gold answer, \
such as an answer saying details are "on pages 102 to 132".

8. STOP TOKEN: Does it end with {stop_token} exactly once?

Return valid JSON only. No markdown fences. No preamble. No extra text. The response \
must begin with "{{" and end with "}}".
{{
  "pass": true or false,
  "checks": {{
    "values_grounding": "pass" or "fail",
    "answer_match": "pass" or "fail",
    "arithmetic_correctness": "pass" or "fail" or "na",
    "analysis_quality": "pass" or "fail" or "na",
    "template_compliance": "pass" or "fail",
    "non_arithmetic_rules": "pass" or "fail" or "na",
    "citation_clean": "pass" or "fail",
    "stop_token": "pass" or "fail"
  }},
  "issues": ["specific issue 1", "specific issue 2"],
  "fix_instruction": "concise rewrite instruction for the fixer, or empty string if pass"
}}

For fix_instruction:
- Do not introduce causes, mechanisms, or business explanations unless they are \
explicitly supported by the provided table/text.
- If the problem is unsupported analysis, instruct the fixer to replace it with a \
grounded descriptive interpretation of the computed values.
- Never suggest outside-knowledge explanations such as typical accounting treatment, \
common business causes, acquisitions, impairments, strategy, demand, pricing, or \
performance unless that explanation appears in the row evidence.
- Do not ask the fixer to remove a scale/unit that is present in the row's scale field.
- Do not ask the fixer to change comma formatting only, such as "4,572" to "4572", \
unless the numeric value itself is wrong.
- Do not ask the fixer to rewrite a correct complete-sentence Final Answer into the \
exact gold-answer fragment unless the generated sentence changes the meaning, omits \
gold-answer components, or adds incorrect facts.

Dataset row:
row_id: {row_id}
answer_type: {answer_type}
question: {question}
gold_answer: {answer}
derivation: {derivation}
scale: {scale}
table_text:
{table_text}
relevant_paragraphs_text:
{relevant_paragraphs_text}

Generated reasoning_target:
{reasoning_target}
"""


def build_judge_prompt(row: dict) -> str:
    return JUDGE_PROMPT_TEMPLATE.format(
        stop_token=STOP_TOKEN,
        row_id=row["row_id"],
        answer_type=row["answer_type"],
        question=row["question"],
        answer=row["answer"],
        derivation=row.get("derivation", "") or "",
        scale=row.get("scale", "") or "not specified",
        table_text=row["table_text"],
        relevant_paragraphs_text=row["relevant_paragraphs_text"],
        reasoning_target=row.get("reasoning_target", ""),
    )


def call_judge(client, prompt: str, max_retries: int = 3) -> str:
    for attempt in range(max_retries):
        try:
            response = client.messages.create(
                model=JUDGE_MODEL,
                max_tokens=2048,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.content[0].text
        except Exception as e:
            if attempt < max_retries - 1:
                wait = 2 ** attempt * 10
                print(f"\n  Judge API error ({e}). Retrying in {wait}s ...")
                time.sleep(wait)
            else:
                raise


def parse_judge_response(raw: str) -> dict | None:
    text = raw.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        start = 1
        end   = len(lines) - 1 if lines[-1].strip() == "```" else len(lines)
        text  = "\n".join(lines[start:end]).strip()
    decoder = json.JSONDecoder()
    parsed_objects = []
    for idx, ch in enumerate(text):
        if ch != "{":
            continue
        try:
            obj, _ = decoder.raw_decode(text[idx:])
        except json.JSONDecodeError:
            continue
        if isinstance(obj, dict):
            parsed_objects.append(obj)
    judge_objects = [
        obj for obj in parsed_objects
        if "pass" in obj and isinstance(obj.get("checks"), dict)
    ]
    return judge_objects[-1] if judge_objects else None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True,
                        help="CSV to judge (accepted or failed rows)")
    parser.add_argument("--sample", type=int, default=None,
                        help="Randomly sample N rows from the input (default: judge all)")
    parser.add_argument("--risky-only", action="store_true",
                        help="Only judge rows that have soft warnings in validation_issues")
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"ERROR: {input_path} not found.")
        return

    tag = input_path.stem

    df = pd.read_csv(input_path, encoding="utf-8")
    print(f"Loaded {len(df)} rows from {input_path}")

    # Filter to risky rows if requested
    if args.risky_only:
        risky = df[
            df["validation_issues"].fillna("").str.contains("WARNING", case=False)
        ]
        print(f"Risky rows (soft warnings): {len(risky)}")
        df = risky.reset_index(drop=True)

    # Random sample if requested
    if args.sample and args.sample < len(df):
        df = df.sample(n=args.sample, random_state=42).reset_index(drop=True)
        print(f"Sampled {len(df)} rows for judging")

    if len(df) == 0:
        print("No rows to judge.")
        return

    if not ANTHROPIC_API_KEY:
        print("ERROR: ANTHROPIC_API_KEY not set. Add it to your .env file.")
        return

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    print(f"Judge model: {JUDGE_MODEL}")
    print(f"Judging {len(df)} rows ...\n")

    judge_rows  = []
    raw_records = []
    last_call_ts = 0.0

    for _, row in tqdm(df.iterrows(), total=len(df), desc="Judging"):
        elapsed = time.time() - last_call_ts
        if elapsed < JUDGE_DELAY:
            time.sleep(JUDGE_DELAY - elapsed)

        prompt  = build_judge_prompt(row.to_dict())
        raw     = ""
        parsed  = None
        status  = "judged"

        try:
            raw    = call_judge(client, prompt)
            parsed = parse_judge_response(raw)
            if parsed is None:
                status = "judge_parse_error"
        except Exception as e:
            status = f"judge_api_error: {e}"

        last_call_ts = time.time()

        raw_records.append({
            "row_id": row["row_id"],
            "raw_response": raw,
            "status": status,
        })

        if parsed:
            judge_rows.append({
                "row_id":            row["row_id"],
                "answer_type":       row["answer_type"],
                "judge_status":      status,
                "judge_pass":        parsed.get("pass", False),
                "check_values":      parsed.get("checks", {}).get("values_grounding", ""),
                "check_answer":      parsed.get("checks", {}).get("answer_match", ""),
                "check_arithmetic":  parsed.get("checks", {}).get("arithmetic_correctness", ""),
                "check_analysis":    parsed.get("checks", {}).get("analysis_quality", ""),
                "check_template":    parsed.get("checks", {}).get("template_compliance", ""),
                "check_nonarith":    parsed.get("checks", {}).get("non_arithmetic_rules", ""),
                "check_citation":    parsed.get("checks", {}).get("citation_clean", ""),
                "check_stoptoken":   parsed.get("checks", {}).get("stop_token", ""),
                "judge_issues":      "; ".join(parsed.get("issues", [])),
                "fix_instruction":   parsed.get("fix_instruction", ""),
            })
        else:
            judge_rows.append({
                "row_id":       row["row_id"],
                "answer_type":  row["answer_type"],
                "judge_status": status,
                "judge_pass":   False,
                "judge_issues": f"judge failed: {status}",
                "fix_instruction": "",
            })

    judge_df = pd.DataFrame(judge_rows)

    for d in [VALIDATION_REPORTS_DIR, FAILED_ROWS_DIR]:
        d.mkdir(parents=True, exist_ok=True)

    report_path = VALIDATION_REPORTS_DIR / f"judge_{tag}.csv"
    judge_df.to_csv(report_path, index=False, encoding="utf-8")

    raw_path = VALIDATION_REPORTS_DIR / f"judge_{tag}_raw.jsonl"
    with open(raw_path, "w", encoding="utf-8") as f:
        for r in raw_records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    # Rows the judge rejected — merge with original row data for the fixer
    failed_ids  = set(judge_df[judge_df["judge_pass"] == False]["row_id"])
    judge_failed = df[df["row_id"].isin(failed_ids)].copy()

    # Attach fix_instruction to each failed row
    instr = judge_df[["row_id", "fix_instruction", "judge_issues"]].set_index("row_id")
    judge_failed["fix_instruction"] = judge_failed["row_id"].map(instr["fix_instruction"])
    judge_failed["validation_issues"] = judge_failed["row_id"].map(instr["judge_issues"])

    failed_path = FAILED_ROWS_DIR / f"judge_failed_{tag}.csv"
    judge_failed.to_csv(failed_path, index=False, encoding="utf-8")

    # Summary
    total    = len(judge_df)
    n_passed = (judge_df["judge_pass"] == True).sum()
    n_failed = total - n_passed
    pass_rate = n_passed / total if total else 0

    print(f"\n{'='*55}")
    print("  JUDGE SUMMARY")
    print(f"{'='*55}")
    print(f"  Total judged: {total}")
    print(f"  Passed:       {n_passed}  ({pass_rate*100:.1f}%)")
    print(f"  Failed:       {n_failed}")

    if n_failed:
        print(f"\n  Failed by answer type:")
        for atype, grp in judge_df[judge_df["judge_pass"] == False].groupby("answer_type"):
            print(f"    {atype:<12}  {len(grp)} failed")

        print(f"\n  Top failing checks:")
        check_cols = [c for c in judge_df.columns if c.startswith("check_")]
        for col in check_cols:
            n_fail = (judge_df[col] == "fail").sum()
            if n_fail:
                print(f"    {col.replace('check_', ''):<20} {n_fail} fail(s)")

    print(f"\n  Judge report  -> {report_path}")
    print(f"  Raw responses -> {raw_path}")
    print(f"  Failed rows   -> {failed_path}")

    if n_failed:
        print(f"\n  Next step: python 06_fix.py --input {failed_path}")
    else:
        print(f"\n  All rows passed the judge.")


if __name__ == "__main__":
    main()
