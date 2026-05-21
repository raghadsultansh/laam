from __future__ import annotations

import argparse
import json
import pickle
import re
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = ROOT.parent
DEFAULT_ANSWERS = ROOT / "results" / "pipeline_answers_for_ragas.csv"
DEFAULT_OUTPUT = ROOT / "results" / "pipeline_answers_full_contexts_for_ragas.csv"


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip()


def find_bm25_store() -> Path:
    candidates = [
        PROJECT_ROOT / "backend" / "app" / "ai_pipeline" / "bm25_store",
        PROJECT_ROOT / ".claude" / "worktrees" / "nostalgic-chebyshev-baa26e" / "backend" / "app" / "ai_pipeline" / "bm25_store",
    ]
    for candidate in candidates:
        if candidate.exists() and any(candidate.glob("*_bm25.pkl")):
            return candidate
    raise FileNotFoundError("Could not find a bm25_store folder containing *_bm25.pkl files.")


def load_docs_by_hash(bm25_store: Path, doc_hash: str):
    path = bm25_store / f"{doc_hash}_bm25.pkl"
    if not path.exists():
        raise FileNotFoundError(f"Missing BM25 cache for {doc_hash}: {path}")
    with path.open("rb") as f:
        return pickle.load(f)


def match_full_context(snippet: str, docs) -> tuple[str, bool]:
    needle = normalize(snippet)
    if not needle:
        return snippet, False

    # The backend source snippet is doc.page_content[:300], so a prefix match is
    # the most faithful reconstruction of the exact context used by generation.
    for doc in docs:
        full = normalize(doc.page_content)
        if full.startswith(needle):
            return doc.page_content, True

    # Be a little forgiving about whitespace/table extraction differences.
    compact_needle = re.sub(r"\W+", "", needle.lower())
    if len(compact_needle) > 80:
        for doc in docs:
            compact_full = re.sub(r"\W+", "", normalize(doc.page_content).lower())
            if compact_needle[:220] in compact_full:
                return doc.page_content, True

    return snippet, False


def main() -> None:
    parser = argparse.ArgumentParser(description="Replace saved 300-char source snippets with full BM25 chunks.")
    parser.add_argument("--answers", type=Path, default=DEFAULT_ANSWERS)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--bm25-store", type=Path, default=None)
    args = parser.parse_args()

    bm25_store = args.bm25_store or find_bm25_store()
    df = pd.read_csv(args.answers)
    cache = {}
    total_contexts = 0
    matched_contexts = 0
    expanded_contexts = []
    match_counts = []

    for _, row in df.iterrows():
        doc_hash = row["doc_hash"]
        if doc_hash not in cache:
            cache[doc_hash] = load_docs_by_hash(bm25_store, doc_hash)
        docs = cache[doc_hash]

        contexts = json.loads(row["contexts"]) if isinstance(row["contexts"], str) and row["contexts"].strip() else []
        full_contexts = []
        row_matches = 0
        for context in contexts:
            total_contexts += 1
            full, matched = match_full_context(context, docs)
            if matched:
                matched_contexts += 1
                row_matches += 1
            full_contexts.append(full)
        expanded_contexts.append(json.dumps(full_contexts, ensure_ascii=False))
        match_counts.append(row_matches)

    df["contexts"] = expanded_contexts
    df["full_context_matches"] = match_counts
    df.to_csv(args.output, index=False, encoding="utf-8-sig")

    summary = {
        "answers": int(len(df)),
        "total_contexts": int(total_contexts),
        "matched_contexts": int(matched_contexts),
        "match_rate": round(matched_contexts / total_contexts, 4) if total_contexts else 0,
        "bm25_store": str(bm25_store),
        "output": str(args.output),
    }
    summary_path = args.output.with_suffix(".summary.json")
    summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
