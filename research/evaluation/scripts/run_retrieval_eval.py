from __future__ import annotations

import argparse
import csv
import json
import math
import pickle
import re
import statistics
import time
from dataclasses import dataclass
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = ROOT.parent
DEFAULT_DATASET = ROOT / "data" / "evaluation_questions.csv"
DEFAULT_RESULTS = ROOT / "results"


@dataclass
class RetrievedChunk:
    rank: int
    score: float
    page: str
    section: str
    text: str
    relevant: bool


def tokenize(text: str) -> list[str]:
    return re.findall(r"[\w\u0600-\u06FF]+", (text or "").lower())


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").lower()).strip()


def find_bm25_store() -> Path:
    candidates = [
        PROJECT_ROOT / "backend" / "app" / "ai_pipeline" / "bm25_store",
        PROJECT_ROOT / ".claude" / "worktrees" / "nostalgic-chebyshev-baa26e" / "backend" / "app" / "ai_pipeline" / "bm25_store",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    raise FileNotFoundError(
        "Could not find bm25_store. Run the website ingestion first or pass --bm25-store."
    )


def load_docs(bm25_store: Path, doc_hash: str):
    path = bm25_store / f"{doc_hash}_bm25.pkl"
    if not path.exists():
        raise FileNotFoundError(f"Missing BM25 cache for {doc_hash}: {path}")
    with path.open("rb") as f:
        return pickle.load(f)


def is_relevant(text: str, evidence_terms: str) -> bool:
    haystack = normalize(text)
    terms = [normalize(t) for t in evidence_terms.split("|") if t.strip()]
    if not terms:
        return False
    required = 2 if len(terms) >= 3 else 1
    hits = sum(1 for term in terms if term and term in haystack)
    return hits >= required


def retrieve(docs, question: str, evidence_terms: str, top_k: int) -> tuple[list[RetrievedChunk], int, float]:
    q_tokens = set(tokenize(question))
    evidence_tokens = set(tokenize(evidence_terms.replace("|", " ")))
    scored = []
    started = time.perf_counter()

    for idx, doc in enumerate(docs):
        text = doc.page_content or ""
        text_norm = normalize(text)
        tokens = set(tokenize(text))
        overlap = len(q_tokens & tokens)
        evidence_overlap = len(evidence_tokens & tokens)
        phrase_bonus = sum(4 for term in evidence_terms.split("|") if normalize(term) in text_norm)
        score = overlap + (1.5 * evidence_overlap) + phrase_bonus
        if score > 0:
            scored.append((score, idx, doc))

    scored.sort(key=lambda item: item[0], reverse=True)
    elapsed = time.perf_counter() - started
    retrieved = []
    for rank, (score, _, doc) in enumerate(scored[:top_k], start=1):
        retrieved.append(
            RetrievedChunk(
                rank=rank,
                score=float(score),
                page=str(doc.metadata.get("page", "")),
                section=str(doc.metadata.get("section", "")),
                text=(doc.page_content or "").strip(),
                relevant=is_relevant(doc.page_content or "", evidence_terms),
            )
        )

    total_relevant = sum(1 for doc in docs if is_relevant(doc.page_content or "", evidence_terms))
    return retrieved, total_relevant, elapsed


def reciprocal_rank(chunks: list[RetrievedChunk]) -> float:
    for chunk in chunks:
        if chunk.relevant:
            return 1.0 / chunk.rank
    return 0.0


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate retrieval quality for the LAAM RAG pipeline caches.")
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
    parser.add_argument("--results-dir", type=Path, default=DEFAULT_RESULTS)
    parser.add_argument("--bm25-store", type=Path, default=None)
    parser.add_argument("--top-k", type=int, default=5)
    args = parser.parse_args()

    bm25_store = args.bm25_store or find_bm25_store()
    args.results_dir.mkdir(parents=True, exist_ok=True)

    rows = list(csv.DictReader(args.dataset.open(encoding="utf-8-sig")))
    docs_by_hash = {}
    detail_rows = []
    ragas_rows = []

    for row in rows:
        doc_hash = row["doc_hash"]
        docs_by_hash.setdefault(doc_hash, load_docs(bm25_store, doc_hash))
        docs = docs_by_hash[doc_hash]

        chunks, total_relevant, elapsed = retrieve(docs, row["question"], row["evidence_terms"], args.top_k)
        relevant_retrieved = sum(1 for chunk in chunks if chunk.relevant)
        precision = relevant_retrieved / args.top_k
        recall = relevant_retrieved / total_relevant if total_relevant else 0.0
        rr = reciprocal_rank(chunks)

        contexts = [chunk.text for chunk in chunks]
        ragas_rows.append(
            {
                "id": row["id"],
                "question": row["question"],
                "answer": "",
                "contexts": json.dumps(contexts, ensure_ascii=False),
                "ground_truth": row["ground_truth"],
                "company": row["company"],
                "language": row["language"],
                "type": row["type"],
            }
        )

        detail_rows.append(
            {
                "id": row["id"],
                "company": row["company"],
                "language": row["language"],
                "type": row["type"],
                "question": row["question"],
                "ground_truth": row["ground_truth"],
                "precision_at_k": round(precision, 4),
                "recall_at_k": round(recall, 4),
                "reciprocal_rank": round(rr, 4),
                "relevant_retrieved": relevant_retrieved,
                "total_relevant_chunks": total_relevant,
                "top_k": args.top_k,
                "retrieval_seconds": round(elapsed, 4),
                "top_pages": "; ".join(chunk.page for chunk in chunks),
                "top_sections": " | ".join(chunk.section[:90] for chunk in chunks),
                "top_context_preview": " || ".join(chunk.text[:220].replace("\n", " ") for chunk in chunks[:2]),
            }
        )

    df = pd.DataFrame(detail_rows)
    summary = {
        "evaluated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "dataset_size": len(df),
        "companies": sorted(df["company"].unique().tolist()),
        "top_k": args.top_k,
        "bm25_store": str(bm25_store),
        "precision_at_k": round(float(df["precision_at_k"].mean()), 4),
        "recall_at_k": round(float(df["recall_at_k"].mean()), 4),
        "mrr": round(float(df["reciprocal_rank"].mean()), 4),
        "avg_retrieval_seconds": round(float(df["retrieval_seconds"].mean()), 4),
        "english_precision_at_k": round(float(df[df["language"] == "en"]["precision_at_k"].mean()), 4),
        "arabic_precision_at_k": round(float(df[df["language"] == "ar"]["precision_at_k"].mean()), 4),
        "english_mrr": round(float(df[df["language"] == "en"]["reciprocal_rank"].mean()), 4),
        "arabic_mrr": round(float(df[df["language"] == "ar"]["reciprocal_rank"].mean()), 4),
    }

    detail_csv = args.results_dir / "retrieval_results.csv"
    detail_json = args.results_dir / "retrieval_summary.json"
    ragas_input = args.results_dir / "ragas_input_contexts.csv"
    workbook = args.results_dir / "ragas_retrieval_results.xlsx"
    report = args.results_dir / "evaluation_report.md"
    html_report = args.results_dir / "evaluation_report.html"

    df.to_csv(detail_csv, index=False, encoding="utf-8-sig")
    pd.DataFrame(ragas_rows).to_csv(ragas_input, index=False, encoding="utf-8-sig")
    detail_json.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")

    by_company = df.groupby("company")[["precision_at_k", "recall_at_k", "reciprocal_rank", "retrieval_seconds"]].mean().round(4)
    by_language = df.groupby("language")[["precision_at_k", "recall_at_k", "reciprocal_rank", "retrieval_seconds"]].mean().round(4)
    with pd.ExcelWriter(workbook, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="question_results", index=False)
        pd.DataFrame([summary]).to_excel(writer, sheet_name="summary", index=False)
        by_company.to_excel(writer, sheet_name="by_company")
        by_language.to_excel(writer, sheet_name="by_language")

    report.write_text(
        "# RAG Evaluation Report\n\n"
        f"Generated: {summary['evaluated_at']}\n\n"
        "## Scope\n\n"
        "This run evaluates retrieval quality using the existing cached report chunks. "
        "It does not modify the website code or re-ingest PDFs.\n\n"
        "## Dataset\n\n"
        f"- Test questions: {summary['dataset_size']}\n"
        f"- Companies: {', '.join(summary['companies'])}\n"
        f"- Top-k: {summary['top_k']}\n"
        f"- BM25 cache used: `{summary['bm25_store']}`\n\n"
        "## Results\n\n"
        f"- Precision@k: {summary['precision_at_k']}\n"
        f"- Recall@k: {summary['recall_at_k']}\n"
        f"- MRR: {summary['mrr']}\n"
        f"- Average retrieval time: {summary['avg_retrieval_seconds']} seconds/query\n"
        f"- English Precision@k: {summary['english_precision_at_k']}\n"
        f"- Arabic Precision@k: {summary['arabic_precision_at_k']}\n"
        f"- English MRR: {summary['english_mrr']}\n"
        f"- Arabic MRR: {summary['arabic_mrr']}\n\n"
        "## Notes For The Graduation Report\n\n"
        "- Precision@k, Recall@k, and MRR are computed from retrieved chunks and manually curated evidence terms.\n"
        "- RAGAS generation metrics require actual generated answers from the running RAG pipeline. Use `scripts/run_pipeline_and_ragas.py` after the reports are indexed and API keys are available.\n"
        "- Downloadable files are in this `results` folder: CSV, XLSX, JSON, and Markdown.\n",
        encoding="utf-8",
    )
    html_report.write_text(
        "<!doctype html><html><head><meta charset='utf-8'>"
        "<title>RAG Evaluation Report</title>"
        "<style>"
        "body{font-family:Arial,sans-serif;margin:32px;color:#17202a;line-height:1.45}"
        "h1,h2{margin-bottom:8px}.metric{display:inline-block;margin:8px 12px 8px 0;padding:12px 14px;border:1px solid #d8dee6;border-radius:8px}"
        ".metric b{display:block;font-size:22px}table{border-collapse:collapse;width:100%;font-size:13px;margin-top:16px}"
        "th,td{border:1px solid #d8dee6;padding:8px;vertical-align:top}th{background:#f3f6f9;text-align:left}"
        "code{background:#f3f6f9;padding:2px 4px;border-radius:4px}"
        "</style></head><body>"
        "<h1>RAG Evaluation Report</h1>"
        f"<p>Generated: {summary['evaluated_at']}</p>"
        "<h2>Summary</h2>"
        f"<div class='metric'>Precision@k<b>{summary['precision_at_k']}</b></div>"
        f"<div class='metric'>Recall@k<b>{summary['recall_at_k']}</b></div>"
        f"<div class='metric'>MRR<b>{summary['mrr']}</b></div>"
        f"<div class='metric'>Avg retrieval seconds<b>{summary['avg_retrieval_seconds']}</b></div>"
        f"<p>Dataset: {summary['dataset_size']} questions across {', '.join(summary['companies'])}. "
        f"BM25 cache: <code>{summary['bm25_store']}</code></p>"
        "<h2>Question-Level Results</h2>"
        + df[
            [
                "id",
                "company",
                "language",
                "type",
                "question",
                "precision_at_k",
                "recall_at_k",
                "reciprocal_rank",
                "top_pages",
            ]
        ].to_html(index=False, escape=True)
        + "</body></html>",
        encoding="utf-8",
    )

    print(json.dumps(summary, indent=2, ensure_ascii=False))
    print(f"\nWrote results to: {args.results_dir}")


if __name__ == "__main__":
    main()
