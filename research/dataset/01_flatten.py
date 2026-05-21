"""
Step 1 - Flatten the nested TAT-QA JSON into a flat CSV.

Each output row = one question, paired with its formatted table and
the relevant paragraphs referenced by that question.

Run:
    python 01_flatten.py
"""

import json
import pandas as pd
from config import SOURCE_JSON, SOURCE_CSV, ALL_DIRS


def format_table(table_rows: list) -> str:
    """Convert a list-of-lists table into a pipe-separated string."""
    lines = []
    for row in table_rows:
        cells = [str(c).strip() for c in row]
        lines.append("| " + " | ".join(cells) + " |")
    return "\n".join(lines)


def format_answer(answer) -> str:
    """Normalize answer (list or scalar) to a plain string."""
    if isinstance(answer, list):
        return " | ".join(str(a) for a in answer)
    return str(answer)


def main():
    for d in ALL_DIRS:
        d.mkdir(parents=True, exist_ok=True)

    print(f"Loading {SOURCE_JSON} ...")
    with open(SOURCE_JSON, encoding="utf-8") as f:
        data = json.load(f)

    rows = []
    row_counter = 1

    for doc in data:
        table      = doc["table"]
        paragraphs = doc["paragraphs"]
        questions  = doc["questions"]

        table_text = format_table(table["table"])

        # Build lookup: paragraph order (string) -> text
        para_by_order = {str(p["order"]): p["text"] for p in paragraphs}
        all_para_text = "\n".join(p["text"] for p in paragraphs)

        for q in questions:
            rel_orders = [str(o) for o in q.get("rel_paragraphs", [])]
            relevant_paragraphs_text = "\n".join(
                para_by_order[o] for o in rel_orders if o in para_by_order
            )
            if not relevant_paragraphs_text.strip():
                relevant_paragraphs_text = all_para_text

            rows.append({
                "row_id":                   f"tatqa_{row_counter:06d}",
                "question":                 q["question"],
                "answer":                   format_answer(q["answer"]),
                "answer_type":              q["answer_type"],
                "derivation":               q.get("derivation", ""),
                "scale":                    q.get("scale", ""),
                "answer_from":              q.get("answer_from", ""),
                "req_comparison":           q.get("req_comparison", False),
                "table_text":               table_text,
                "relevant_paragraphs_text": relevant_paragraphs_text,
            })
            row_counter += 1

    df = pd.DataFrame(rows)
    df.to_csv(SOURCE_CSV, index=False, encoding="utf-8")

    print(f"\nTotal rows:  {len(df)}")
    print("\nAnswer type distribution:")
    print(df["answer_type"].value_counts().to_string())
    print(f"\nSaved -> {SOURCE_CSV}")


if __name__ == "__main__":
    main()
