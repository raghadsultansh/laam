"""
Step 2 - Create a stratified sample from the source CSV.

Automatically excludes row_ids that already appear in any accepted_*.csv file
in batch_outputs/ so re-running never re-generates rows you already have.

For the 50-row run the exact counts from config.SAMPLE_DISTRIBUTION are used.
For larger sizes the sample is proportional across answer_type.

Run:
    python 02_sample.py --size 500
    python 02_sample.py --size 3000
    python 02_sample.py --size 3000 --no-exclude   (skip dedup, useful for testing)
"""

import argparse
import pandas as pd
from config import SOURCE_CSV, INPUT_DIR, BATCH_OUTPUTS_DIR, SAMPLE_DISTRIBUTION


def load_excluded_ids(no_exclude: bool) -> set:
    """Collect row_ids already in any accepted_*.csv in batch_outputs/."""
    if no_exclude:
        return set()
    excluded = set()
    accepted_files = list(BATCH_OUTPUTS_DIR.glob("accepted_*.csv"))
    if accepted_files:
        print(f"Excluding already-accepted rows from {len(accepted_files)} file(s):")
        for f in sorted(accepted_files):
            try:
                df = pd.read_csv(f, encoding="utf-8", usecols=["row_id"])
                excluded.update(df["row_id"].tolist())
                print(f"  {f.name}: {len(df)} rows")
            except Exception as e:
                print(f"  WARNING: could not read {f.name}: {e}")
    return excluded


def stratified_sample(df: pd.DataFrame, n: int) -> pd.DataFrame:
    target = SAMPLE_DISTRIBUTION.get(n)

    if target:
        parts = []
        for atype, count in target.items():
            pool   = df[df["answer_type"] == atype]
            actual = min(count, len(pool))
            if actual == 0:
                print(f"  WARNING: no rows found for answer_type='{atype}'")
                continue
            parts.append(pool.sample(n=actual, random_state=42))
        return pd.concat(parts).sample(frac=1, random_state=42).reset_index(drop=True)

    # Proportional stratified sample for sizes not in the table
    frac = n / len(df)
    parts = []
    for _, group in df.groupby("answer_type"):
        parts.append(group.sample(frac=frac, random_state=42))
    return pd.concat(parts).sample(frac=1, random_state=42).reset_index(drop=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--size", type=int, default=50,
                        help="Number of rows to sample (default: 50)")
    parser.add_argument("--no-exclude", action="store_true",
                        help="Skip auto-exclusion of already-accepted row_ids")
    args = parser.parse_args()

    if not SOURCE_CSV.exists():
        print(f"ERROR: {SOURCE_CSV} not found. Run 01_flatten.py first.")
        return

    df = pd.read_csv(SOURCE_CSV, encoding="utf-8")
    print(f"Source rows: {len(df)}")

    excluded = load_excluded_ids(args.no_exclude)
    if excluded:
        before = len(df)
        df = df[~df["row_id"].isin(excluded)].reset_index(drop=True)
        print(f"After excluding {len(excluded)} accepted rows: {len(df)} available\n")
    else:
        print()

    if len(df) < args.size:
        print(f"WARNING: only {len(df)} rows available after exclusion, requested {args.size}.")
        print("Consider running with a smaller --size or generating more source data.")

    sample = stratified_sample(df, args.size)

    out_path = INPUT_DIR / f"tatqa_sample_{args.size}.csv"
    sample.to_csv(out_path, index=False, encoding="utf-8")

    print(f"Sample size: {len(sample)}")
    print("\nAnswer type distribution:")
    print(sample["answer_type"].value_counts().to_string())
    print(f"\nSaved -> {out_path}")


if __name__ == "__main__":
    main()
