"""
Step 7 - Combine all accepted_*.csv files into one final clean dataset.

Run this only after all batches have been generated, validated, and fixed.
The final CSV must pass every validation target before you move to training.

Run:
    python 07_finalize.py
"""

import pandas as pd
from config import (
    BATCH_OUTPUTS_DIR, FINAL_DIR, STOP_TOKEN,
    CITATION_LEAK_PHRASES,
)

FINAL_COLUMNS = [
    "row_id",
    "question",
    "answer",
    "answer_type",
    "derivation",
    "scale",
    "table_text",
    "relevant_paragraphs_text",
    "reasoning_target",
    "generation_model",
    "generation_status",
    "validation_status",
    "validation_issues",
    "retry_count",
    "created_at",
    "used_values",
    "derived_answer",
    "quality_notes",
]


def check_training_targets(df: pd.DataFrame) -> list:
    """Run the hard pass/fail targets from the plan. Return list of failures."""
    failures = []
    rt = df["reasoning_target"].fillna("")

    empty = (rt.str.strip() == "").sum()
    if empty:
        failures.append(f"Empty reasoning_target rows: {empty}  (required: 0)")

    missing_stop = (~rt.str.contains(STOP_TOKEN, regex=False)).sum()
    if missing_stop:
        failures.append(f"Missing stop token {STOP_TOKEN!r}: {missing_stop}  (required: 0)")

    def has_model_generated_citation_leak(row: pd.Series) -> bool:
        text = str(row.get("reasoning_target", "")).lower()
        question = str(row.get("question", "")).lower()
        answer = str(row.get("answer", "")).lower()
        return any(
            p.lower() in text
            and p.lower() not in question
            and p.lower() not in answer
            for p in CITATION_LEAK_PHRASES
        )

    citation_hits = df.apply(has_model_generated_citation_leak, axis=1).sum()
    if citation_hits:
        failures.append(f"Citation leakage rows: {citation_hits}  (required: 0)")

    arith = df[df["answer_type"] == "arithmetic"]
    contradictions = arith["reasoning_target"].str.contains(
        "No numerical calculation required", regex=False, na=False
    ).sum()
    if contradictions:
        failures.append(
            f"Arithmetic rows saying 'No numerical calculation required': {contradictions}  (required: 0)"
        )

    non_arith = df[df["answer_type"].isin(["span", "multi-span", "count"])]
    analysis_wrong = non_arith["reasoning_target"].apply(
        lambda t: "Analysis:" in str(t) and "No financial analysis required." not in str(t)
    ).sum()
    if analysis_wrong:
        failures.append(
            f"Non-arithmetic rows with real Analysis content: {analysis_wrong}  (required: 0)"
        )

    non_arith_missing_analysis = non_arith["reasoning_target"].apply(
        lambda t: "Analysis:" not in str(t)
    ).sum()
    if non_arith_missing_analysis:
        failures.append(
            f"Non-arithmetic rows missing Analysis section: {non_arith_missing_analysis}  (required: 0)"
        )

    arith_missing_values = arith["reasoning_target"].apply(
        lambda t: "Values used:" not in str(t)
    ).sum()
    if arith_missing_values:
        failures.append(
            f"Arithmetic rows missing 'Values used:': {arith_missing_values}  (required: 0)"
        )

    return failures


def main():
    FINAL_DIR.mkdir(parents=True, exist_ok=True)

    accepted_files = sorted(BATCH_OUTPUTS_DIR.glob("accepted_*.csv"))
    if not accepted_files:
        print(f"No accepted_*.csv files found in {BATCH_OUTPUTS_DIR}.")
        print("Run 03_generate.py -> 04_validate.py first.")
        return

    print(f"Found {len(accepted_files)} accepted file(s):")
    for f in accepted_files:
        print(f"  {f}")

    dfs      = [pd.read_csv(f, encoding="utf-8") for f in accepted_files]
    combined = pd.concat(dfs, ignore_index=True)
    combined = combined.drop_duplicates(subset="row_id", keep="last")

    for col in FINAL_COLUMNS:
        if col not in combined.columns:
            combined[col] = ""
    combined = combined[FINAL_COLUMNS]

    print(f"\nTotal rows after deduplication: {len(combined)}")
    print("\nAnswer type distribution:")
    print(combined["answer_type"].value_counts().to_string())

    print(f"\n{'='*55}")
    print("  TRAINING GATE CHECK")
    print(f"{'='*55}")
    failures = check_training_targets(combined)

    if failures:
        print("  FAIL - Dataset does NOT meet training targets:")
        for f in failures:
            print(f"     - {f}")
        print("\n  Do NOT move to training. Fix these issues first.")
        out_path = FINAL_DIR / f"tatqa_reasoning_v2_{len(combined)}_NEEDS_REVIEW.csv"
        combined.to_csv(out_path, index=False, encoding="utf-8")
        print(f"\n  Saved for review -> {out_path}")
    else:
        print("  PASS - All training targets met. Dataset is ready.")
        out_path = FINAL_DIR / f"tatqa_reasoning_v2_{len(combined)}.csv"
        combined.to_csv(out_path, index=False, encoding="utf-8")
        print(f"\n  Final dataset -> {out_path}")
        print(f"  Next step: python 07_prep_model_versions.py")


if __name__ == "__main__":
    main()
