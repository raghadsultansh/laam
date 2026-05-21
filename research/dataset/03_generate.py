"""
Step 3 - Generate reasoning_target for each row using Gemini 2.5 Flash.

Run:
    python 03_generate.py --input input/tatqa_sample_50.csv
    python 03_generate.py --input input/tatqa_sample_200.csv
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
    BATCH_OUTPUTS_DIR,
)

# Prompt template
PROMPT_TEMPLATE = """\
You are generating a supervised fine-tuning target for a financial reasoning dataset.

Task:
Given one dataset row from TaTQA, create a concise reasoning_target that teaches a model \
how to answer the question from the provided table/text evidence.

Important:
- Use only the information provided in the row.
- Do not introduce outside facts.
- Do not invent numbers, dates, companies, metrics, or explanations.
- Do not add citations, page references, paragraph references, source references, \
or phrases like "according to the source".
- Do not mention paragraph numbers, table numbers, row numbers, page numbers, \
evidence labels, or source locations of any kind.
- Do not write phrases like "from paragraph 1", "from the table", "in row 3", \
"on page 5", or any similar source-location reference.
- The reasoning must read as if the extracted values are simply known facts, \
not retrieved from a specific location.
- The final answer must match the given gold answer exactly.
- The reasoning_target must teach value extraction before calculation.
- Keep the wording direct, technical, and concise.
- End the reasoning_target with {stop_token} exactly once.
- Return valid JSON only. Do not write markdown fences.

Answer-type rules:

1. If answer_type is "arithmetic":
Use exactly this structure:
Reasoning & Calculations:
Values used:
- List the relevant metric/year/value entries extracted from the table/text.
Calculation:
- Show the formula and computed result.
- If the result is a percentage, explicitly show the x 100 step so the Calculation \
result matches the number stated in the Final Answer \
(e.g., "0.2545 x 100 = 25.45 percent", not just "0.2545").
Analysis:
- Write 1-2 sentences describing what the computed result means, \
grounded only in the values in the provided table/text.
- State what changed or what the number represents (e.g., an increase, a ratio, \
a proportion). Do NOT explain why it changed.
- Do NOT add causes, business drivers, accounting reasons, strategic motives, \
market conditions, acquisitions, impairments, or performance claims unless \
that explanation is explicitly stated in the provided table or paragraphs.
- If the source gives only numbers with no explanatory context, keep the \
analysis purely descriptive: state what was computed and what it represents.
Final Answer:
- Write one complete sentence that matches the gold answer.
{stop_token}

2. If answer_type is "span":
Use exactly this structure:
Reasoning & Calculations:
Values used:
- Identify the single value or phrase found in the table/text.
Calculation:
No numerical calculation required.
Analysis:
No financial analysis required.
Final Answer:
- Write one complete sentence that matches the gold answer.
{stop_token}

3. If answer_type is "multi-span":
Use exactly this structure:
Reasoning & Calculations:
Values used:
- Identify each requested value or phrase found in the table/text.
Calculation:
No numerical calculation required.
Analysis:
No financial analysis required.
Final Answer:
- Write one complete sentence that includes all parts of the gold answer.
{stop_token}

4. If answer_type is "count":
List EVERY candidate item from the source in the Values used section - do NOT \
pre-filter to only the qualifying items. If a threshold or condition exists, \
add it as a bullet too. In Calculation, compare each candidate explicitly against \
the condition, mark whether it qualifies, then state the final count.
Use exactly this structure:
Reasoning & Calculations:
Values used:
- [Every candidate item with its value - list ALL, not just those that meet the condition]
- [Threshold or condition being tested, if any]
Calculation:
Comparing each candidate:
- [Item 1]: [value] ([qualifies or does not qualify])
- [Item 2]: [value] ([qualifies or does not qualify])
Counting items that qualify: [actual count number]
Analysis:
No financial analysis required.
Final Answer:
- Write one complete sentence that matches the gold answer.
{stop_token}

Example for "How many years did revenue exceed $5,000M?":
Reasoning & Calculations:
Values used:
- Revenue 2019: $4,031 million
- Revenue 2018: $7,838 million
- Revenue 2017: $8,300 million
- Threshold: $5,000 million
Calculation:
Comparing each year to the threshold:
- 2019: $4,031M < $5,000M (does not exceed)
- 2018: $7,838M > $5,000M (exceeds)
- 2017: $8,300M > $5,000M (exceeds)
Counting items that qualify: 2
Analysis:
No financial analysis required.
Final Answer:
Revenue exceeded $5,000M in 2 years.
{stop_token}

Quality requirements:
- The Values used section is mandatory for every answer type.
- Every answer type must include an Analysis section.
- Arithmetic rows must not say "No numerical calculation required." and must have real financial analysis.
- Non-arithmetic rows (span, multi-span, count) must write exactly "No financial analysis required." in the Analysis section.
- If scale is provided (e.g. thousand, million, percent), include it in the Final Answer.
- If scale is empty or "not specified", do not invent a unit.
- The Final Answer must be directly responsive to the question.

Return JSON in this exact schema:
{{
  "row_id": "...",
  "answer_type": "...",
  "reasoning_target": "...",
  "derived_answer": "...",
  "used_values": ["..."],
  "quality_notes": "..."
}}

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
"""


def build_prompt(row: dict) -> str:
    return PROMPT_TEMPLATE.format(
        stop_token=STOP_TOKEN,
        row_id=row["row_id"],
        answer_type=row["answer_type"],
        question=row["question"],
        answer=row["answer"],
        derivation=row.get("derivation", ""),
        scale=row.get("scale", "") or "not specified",
        table_text=row["table_text"],
        relevant_paragraphs_text=row["relevant_paragraphs_text"],
    )


# Paid tier has much higher limits; small buffer to avoid hammering the API
API_CALL_DELAY = 0.5


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
    """Extract the JSON object from a Gemini response, tolerating markdown fences."""
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
    parser.add_argument("--input",  required=True,
                        help="Path to input CSV (e.g. input/tatqa_sample_50.csv)")
    parser.add_argument("--output", default=None,
                        help="Path for output CSV (auto-named if omitted)")
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"ERROR: {input_path} not found.")
        return

    if args.output:
        output_path = Path(args.output)
    else:
        tag = input_path.stem.replace("tatqa_sample_", "")
        output_path = BATCH_OUTPUTS_DIR / f"generated_{tag}.csv"

    BATCH_OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(input_path, encoding="utf-8")
    print(f"Loaded {len(df)} rows from {input_path}")
    print(f"Generator model: {GENERATOR_MODEL}")
    print(f"Stop token:      {STOP_TOKEN}\n")

    if not GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY not set. Add it to your .env file.")
        return

    client = genai.Client(api_key=GEMINI_API_KEY)

    # Checkpoint: auto-resume if a previous run was interrupted
    checkpoint_path = output_path.with_suffix(".checkpoint.jsonl")
    processed_ids   = set()
    results         = []
    raw_records     = []

    if checkpoint_path.exists():
        print(f"Checkpoint found — resuming from {checkpoint_path}")
        with open(checkpoint_path, "r", encoding="utf-8") as ckpt_f:
            for line in ckpt_f:
                rec = json.loads(line)
                results.append(rec)
                processed_ids.add(rec["row_id"])
        print(f"  Skipping {len(processed_ids)} already-processed rows\n")

    checkpoint_f = open(checkpoint_path, "a", encoding="utf-8")
    last_call_ts = 0.0

    for _, row in tqdm(df.iterrows(), total=len(df), desc="Generating"):
        if row["row_id"] in processed_ids:
            continue

        elapsed = time.time() - last_call_ts
        if elapsed < API_CALL_DELAY:
            time.sleep(API_CALL_DELAY - elapsed)

        prompt = build_prompt(row.to_dict())
        status = "success"
        parsed = None
        raw    = ""

        try:
            raw    = call_gemini(client, prompt)
            parsed = parse_json_response(raw)
            if parsed is None:
                status = "json_parse_error"
        except json.JSONDecodeError:
            status = "json_parse_error"
        except Exception as e:
            status = f"api_error: {e}"

        last_call_ts = time.time()

        raw_records.append({
            "row_id": row["row_id"],
            "raw_response": raw,
            "status": status,
        })

        result = row.to_dict()
        result["generation_model"]  = GENERATOR_MODEL
        result["generation_status"] = status
        result["created_at"]        = datetime.now(timezone.utc).isoformat()
        result["retry_count"]       = 0

        if parsed:
            result["reasoning_target"] = parsed.get("reasoning_target", "")
            result["derived_answer"]   = parsed.get("derived_answer", "")
            result["used_values"]      = json.dumps(parsed.get("used_values", []))
            result["quality_notes"]    = parsed.get("quality_notes", "")
        else:
            result["reasoning_target"] = ""
            result["derived_answer"]   = ""
            result["used_values"]      = "[]"
            result["quality_notes"]    = ""

        results.append(result)
        checkpoint_f.write(json.dumps(result, ensure_ascii=False) + "\n")
        checkpoint_f.flush()

    checkpoint_f.close()

    # Clean up checkpoint on successful completion
    if checkpoint_path.exists():
        checkpoint_path.unlink()

    out_df = pd.DataFrame(results)
    out_df.to_csv(output_path, index=False, encoding="utf-8")

    raw_path = output_path.with_name(output_path.stem + "_raw.jsonl")
    with open(raw_path, "w", encoding="utf-8") as f:
        for r in raw_records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    success_count = sum(1 for r in results if r["generation_status"] == "success")
    print(f"\nSuccessfully generated: {success_count}/{len(df)}")
    print(f"Output CSV  -> {output_path}")
    print(f"Raw JSONL   -> {raw_path}")
    print(f"\nNext step: python 04_validate.py --input {output_path}")


if __name__ == "__main__":
    main()
