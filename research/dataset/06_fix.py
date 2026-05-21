"""
Step 6 - Send failed rows to Gemini for rewriting, then re-validate.

Only run this after 04_validate.py or 05_judge.py has produced a failed_<tag>.csv.
Fixed rows that pass validation are merged into accepted_<tag>.csv.

Run:
    python 06_fix.py --input failed_rows/failed_50.csv
"""

import argparse
import json
import time
import pandas as pd
from datetime import datetime, timezone
from pathlib import Path
from tqdm import tqdm
from google import genai

from config import (
    GEMINI_API_KEY, GENERATOR_MODEL, STOP_TOKEN,
    FAILED_ROWS_DIR, BATCH_OUTPUTS_DIR,
)
import importlib.util as _ilu, sys as _sys
_spec = _ilu.spec_from_file_location("validate", __file__.replace("06_fix.py", "04_validate.py"))
_mod  = _ilu.module_from_spec(_spec); _spec.loader.exec_module(_mod); _sys.modules["validate"] = _mod
from validate import validate_row, is_hard_failure

API_CALL_DELAY = 0.5

FIXER_PROMPT_TEMPLATE = """\
You are fixing a failed reasoning_target for a financial reasoning dataset.

Rewrite the reasoning_target so it follows all rules.

Rules:
- Use only the provided row information.
- Do not change the gold answer.
- Do not invent values, numbers, or metrics.
- Do not add citations, source references, page references, or paragraph references.
- Include Values used for every answer type.
- Arithmetic rows must include Calculation and a 1-2 sentence Analysis that describes \
what the computed result means (e.g., an increase, a ratio, a proportion), grounded only \
in the values in the provided table/text. Do NOT explain why it changed. Do NOT add causes, \
business drivers, accounting reasons, strategic motives, market conditions, acquisitions, \
impairments, or performance claims unless that explanation is explicitly stated in the \
provided table or paragraphs. If the source gives only numbers with no explanatory context, \
keep the analysis purely descriptive.
- Non-arithmetic rows (span, multi-span, count) must write exactly "No financial analysis required." in the Analysis section.
- End with {stop_token} exactly once.
- Return valid JSON only. Do not write markdown fences.

Validation issues to fix:
{validation_issues}

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

Bad reasoning_target:
{bad_reasoning_target}

Return JSON:
{{
  "row_id": "...",
  "reasoning_target": "...",
  "derived_answer": "...",
  "used_values": ["..."],
  "fix_notes": "..."
}}
"""


def build_fix_prompt(row: dict) -> str:
    return FIXER_PROMPT_TEMPLATE.format(
        stop_token=STOP_TOKEN,
        validation_issues=row.get("validation_issues", ""),
        row_id=row["row_id"],
        answer_type=row["answer_type"],
        question=row["question"],
        answer=row["answer"],
        derivation=row.get("derivation", ""),
        scale=row.get("scale", "") or "not specified",
        table_text=row["table_text"],
        relevant_paragraphs_text=row["relevant_paragraphs_text"],
        bad_reasoning_target=row.get("reasoning_target", ""),
    )


def call_gemini(client, prompt: str, max_retries: int = 3) -> str:
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model=GENERATOR_MODEL,
                contents=prompt,
            )
            return response.text
        except Exception as e:
            if attempt < max_retries - 1:
                wait = 2 ** attempt * 10
                print(f"\n  API error ({e}). Retrying in {wait}s ...")
                time.sleep(wait)
            else:
                raise


def parse_json_response(raw: str) -> dict | None:
    text = raw.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        start = 1
        end   = len(lines) - 1 if lines[-1].strip() == "```" else len(lines)
        text  = "\n".join(lines[start:end]).strip()
    brace_start = text.find("{")
    brace_end   = text.rfind("}") + 1
    if brace_start == -1 or brace_end <= 0:
        return None
    return json.loads(text[brace_start:brace_end])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True,
                        help="Failed CSV from 04_validate.py")
    args = parser.parse_args()

    failed_path = Path(args.input)
    if not failed_path.exists():
        print(f"ERROR: {failed_path} not found.")
        return

    tag = failed_path.stem.replace("failed_", "")

    df = pd.read_csv(failed_path, encoding="utf-8")
    print(f"Fixing {len(df)} failed rows ...")

    if not GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY not set. Add it to your .env file.")
        return

    client = genai.Client(api_key=GEMINI_API_KEY)

    fixed_rows   = []
    last_call_ts = 0.0

    for _, row in tqdm(df.iterrows(), total=len(df), desc="Fixing"):
        elapsed = time.time() - last_call_ts
        if elapsed < API_CALL_DELAY:
            time.sleep(API_CALL_DELAY - elapsed)

        prompt = build_fix_prompt(row.to_dict())
        status = "fixed"
        parsed = None
        raw    = ""

        try:
            raw    = call_gemini(client, prompt)
            parsed = parse_json_response(raw)
            if parsed is None:
                status = "fix_json_parse_error"
        except json.JSONDecodeError:
            status = "fix_json_parse_error"
        except Exception as e:
            status = f"fix_api_error: {e}"

        last_call_ts = time.time()

        result = row.to_dict()
        result["retry_count"] = int(row.get("retry_count", 0)) + 1

        if parsed:
            result["reasoning_target"] = parsed.get("reasoning_target", "")
            result["derived_answer"]   = parsed.get("derived_answer", "")
            result["used_values"]      = json.dumps(parsed.get("used_values", []))
            result["quality_notes"]    = parsed.get("fix_notes", "")

            re_issues   = validate_row(result)
            still_fails = is_hard_failure(re_issues)
            result["validation_status"] = "fail" if still_fails else "pass"
            result["validation_issues"] = "; ".join(re_issues)
            result["generation_status"] = status
        else:
            result["generation_status"] = status
            result["validation_status"] = "fail"
            result["validation_issues"] = f"fix failed: {status}"

        fixed_rows.append(result)

    fixed_df = pd.DataFrame(fixed_rows)

    all_fixed_path = FAILED_ROWS_DIR / f"fixed_{tag}.csv"
    fixed_df.to_csv(all_fixed_path, index=False, encoding="utf-8")

    now_passing   = fixed_df[fixed_df["validation_status"] == "pass"]
    still_failing = fixed_df[fixed_df["validation_status"] != "pass"]

    accepted_path = BATCH_OUTPUTS_DIR / f"accepted_{tag}.csv"
    if accepted_path.exists() and len(now_passing):
        existing = pd.read_csv(accepted_path, encoding="utf-8")
        merged   = pd.concat([existing, now_passing], ignore_index=True)
        merged.to_csv(accepted_path, index=False, encoding="utf-8")
        print(f"\nAppended {len(now_passing)} fixed rows to {accepted_path}")
    elif len(now_passing):
        now_passing.to_csv(accepted_path, index=False, encoding="utf-8")
        print(f"\nSaved {len(now_passing)} fixed rows to {accepted_path}")

    still_failing.to_csv(failed_path, index=False, encoding="utf-8")

    print(f"\nFixed:         {len(now_passing)}/{len(df)} rows now pass")
    print(f"Still failing: {len(still_failing)}")
    print(f"All fixed CSV  -> {all_fixed_path}")

    if len(still_failing) > 0:
        print(f"\n  {len(still_failing)} rows still fail. Inspect {failed_path} manually.")


if __name__ == "__main__":
    main()
