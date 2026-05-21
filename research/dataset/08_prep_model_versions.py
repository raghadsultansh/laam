"""
Step 8 - Create per-model training CSVs with native stop tokens.

Replaces the stop token in reasoning_target with each model family's
native end-of-turn token. Run this after 07_finalize.py.

Run:
    python 08_prep_model_versions.py
"""

import pandas as pd
from config import FINAL_DIR

# Source token currently embedded in the dataset
SOURCE_TOKEN = "<|im_end|>"

# Map: training tag -> native stop token
STOP_TOKENS = {
    "qwen":     "<|im_end|>",
    "llama":    "<|eot_id|>",
    "deepseek": "<|end▁of▁sentence|>",
}


TRAINING_COLUMNS = [
    "question",
    "answer",
    "derivation",
    "answer_type",
    "answer_from",
    "scale",
    "table_text",
    "relevant_paragraphs_text",
    "reasoning_target",
]


def main():
    candidates = [
        f for f in FINAL_DIR.glob("tatqa_reasoning_v2_*.csv")
        if "NEEDS_REVIEW" not in f.name
        and "qwen" not in f.name
        and "llama" not in f.name
        and "deepseek" not in f.name
    ]
    if not candidates:
        print(f"No finalized dataset found in {FINAL_DIR}.")
        print("Run 07_finalize.py first.")
        return

    # Sort by the row count in the filename (numeric), not lexicographic
    def row_count_from_name(p):
        import re
        m = re.search(r"_(\d+)\.csv$", p.name)
        return int(m.group(1)) if m else 0

    source_csv = sorted(candidates, key=row_count_from_name)[-1]
    df = pd.read_csv(source_csv, encoding="utf-8")
    print(f"Source: {source_csv}  ({len(df)} rows)")

    # Merge answer_from back from source CSV if missing (not in FINAL_COLUMNS)
    from config import SOURCE_CSV
    if "answer_from" not in df.columns:
        src = pd.read_csv(SOURCE_CSV, encoding="utf-8", usecols=["row_id", "answer_from"])
        df = df.merge(src, on="row_id", how="left")

    for tag, stop_token in STOP_TOKENS.items():
        out = df.copy()
        out["reasoning_target"] = out["reasoning_target"].str.replace(
            SOURCE_TOKEN, stop_token, regex=False
        )
        # Keep only training-relevant columns, drop pipeline metadata
        cols = [c for c in TRAINING_COLUMNS if c in out.columns]
        out = out[cols]
        out_path = FINAL_DIR / f"tatqa_reasoning_v2_{tag}.csv"
        out.to_csv(out_path, index=False, encoding="utf-8")
        print(f"  Created -> {out_path}  ({len(out)} rows, {len(cols)} columns)")

    print("\nAll model-specific CSVs created.")
    print("Remember to update STOP_TOKEN in config.py before each training run.")


if __name__ == "__main__":
    main()
