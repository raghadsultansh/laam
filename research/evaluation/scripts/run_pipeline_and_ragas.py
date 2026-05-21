from __future__ import annotations

import argparse
import ast
import csv
import json
import os
import sys
import time
from pathlib import Path

import pandas as pd
from datasets import Dataset
from dotenv import load_dotenv


ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = ROOT.parent
DEFAULT_DATASET = ROOT / "data" / "evaluation_questions.csv"
DEFAULT_RESULTS = ROOT / "results"


def find_bm25_store() -> Path | None:
    candidates = [
        PROJECT_ROOT / "backend" / "app" / "ai_pipeline" / "bm25_store",
        PROJECT_ROOT / ".claude" / "worktrees" / "nostalgic-chebyshev-baa26e" / "backend" / "app" / "ai_pipeline" / "bm25_store",
    ]
    for candidate in candidates:
        if candidate.exists() and any(candidate.glob("*_bm25.pkl")):
            return candidate
    return None


def import_pipeline(bm25_store: Path | None = None):
    backend_dir = PROJECT_ROOT / "backend"
    sys.path.insert(0, str(backend_dir))
    load_dotenv(PROJECT_ROOT / ".env")
    load_dotenv(backend_dir / ".env")
    resolved_bm25_store = bm25_store or find_bm25_store()
    if resolved_bm25_store is not None:
        os.environ["BM25_STORAGE_PATH"] = str(resolved_bm25_store)
    os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
    os.environ.setdefault("HF_HUB_OFFLINE", "1")
    import app.ai_pipeline.adapter as pipeline

    return pipeline


def run_pipeline(
    dataset_path: Path,
    results_dir: Path,
    limit: int | None = None,
    bm25_store: Path | None = None,
    resume: bool = True,
    retry_errors: bool = False,
) -> Path:
    pipeline = import_pipeline(bm25_store=bm25_store)
    rows = list(csv.DictReader(dataset_path.open(encoding="utf-8-sig")))
    if limit is not None:
        rows = rows[:limit]
    answers_path = results_dir / "pipeline_answers_for_ragas.csv"

    output_rows = []
    completed_ids = set()
    if resume and answers_path.exists():
        existing = list(csv.DictReader(answers_path.open(encoding="utf-8-sig")))
        if retry_errors:
            output_rows.extend([row for row in existing if not row.get("error")])
            completed_ids = {row["id"] for row in existing if row.get("answer") and not row.get("error")}
        else:
            output_rows.extend(existing)
            completed_ids = {row["id"] for row in existing if row.get("answer") or row.get("error")}

    fieldnames = [
        "id",
        "question",
        "answer",
        "contexts",
        "ground_truth",
        "company",
        "language",
        "type",
        "difficulty",
        "report",
        "doc_hash",
        "response_seconds",
        "error",
    ]

    def save_checkpoint() -> None:
        pd.DataFrame(output_rows, columns=fieldnames).to_csv(
            answers_path,
            index=False,
            encoding="utf-8-sig",
        )

    for row in rows:
        if row["id"] in completed_ids:
            print(f"{row['id']}: skipped existing")
            continue
        started = time.perf_counter()
        error = ""
        answer = ""
        contexts = []
        try:
            result = pipeline.answer_question(row["question"], row["doc_hash"])
            answer = result.get("answer", "")
            contexts = [source.get("snippet", "") for source in result.get("sources", [])]
        except Exception as exc:
            error = repr(exc)
        elapsed = time.perf_counter() - started
        output_rows.append(
            {
                "id": row["id"],
                "question": row["question"],
                "answer": answer,
                "contexts": json.dumps(contexts, ensure_ascii=False),
                "ground_truth": row["ground_truth"],
                "company": row["company"],
                "language": row["language"],
                "type": row["type"],
                "difficulty": row.get("difficulty", ""),
                "report": row.get("report", ""),
                "doc_hash": row.get("doc_hash", ""),
                "response_seconds": round(elapsed, 4),
                "error": error,
            }
        )
        save_checkpoint()
        status = "ERROR" if error else "ok"
        print(f"{row['id']}: {status} {elapsed:.2f}s")

    return answers_path


def evaluate_with_ragas(answers_path: Path, results_dir: Path) -> None:
    load_dotenv(PROJECT_ROOT / ".env")
    load_dotenv(PROJECT_ROOT / "backend" / ".env")

    from ragas import evaluate
    from ragas.metrics import (
        answer_correctness,
        answer_relevancy,
        context_precision,
        context_recall,
        faithfulness,
    )

    df = pd.read_csv(answers_path)
    if "error" in df.columns:
        failed = df[df["error"].fillna("") != ""]
        if not failed.empty:
            failed.to_csv(results_dir / "pipeline_answer_errors.csv", index=False, encoding="utf-8-sig")
            df = df[df["error"].fillna("") == ""].copy()
    df["contexts"] = df["contexts"].apply(json.loads)
    df["reference"] = df["ground_truth"]
    dataset = Dataset.from_pandas(df[["question", "answer", "contexts", "ground_truth", "reference"]])

    result = evaluate(
        dataset,
        metrics=[
            faithfulness,
            answer_relevancy,
            context_precision,
            context_recall,
            answer_correctness,
        ],
    )
    scores = result.to_pandas()
    scores.to_csv(results_dir / "ragas_generation_scores.csv", index=False, encoding="utf-8-sig")

    merged = pd.concat([df.reset_index(drop=True), scores.reset_index(drop=True)], axis=1)
    merged.to_excel(results_dir / "ragas_generation_scores.xlsx", index=False)

    metric_cols = [col for col in scores.columns if pd.api.types.is_numeric_dtype(scores[col])]
    summary = {col: round(float(scores[col].mean()), 4) for col in metric_cols}
    summary["avg_response_seconds"] = round(float(df["response_seconds"].mean()), 4)
    (results_dir / "ragas_generation_summary.json").write_text(
        json.dumps(summary, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(json.dumps(summary, indent=2, ensure_ascii=False))


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the actual website RAG pipeline and score it with RAGAS.")
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
    parser.add_argument("--results-dir", type=Path, default=DEFAULT_RESULTS)
    parser.add_argument("--answers", type=Path, default=None, help="Use an existing answers CSV instead of calling the pipeline.")
    parser.add_argument("--skip-ragas", action="store_true", help="Only collect pipeline answers.")
    parser.add_argument("--limit", type=int, default=None, help="Only run the first N questions. Useful for smoke tests.")
    parser.add_argument("--bm25-store", type=Path, default=None, help="Path to the folder containing *_bm25.pkl files.")
    parser.add_argument("--no-resume", action="store_true", help="Ignore existing answer checkpoints and start from scratch.")
    parser.add_argument("--retry-errors", action="store_true", help="When resuming, rerun rows that previously failed.")
    args = parser.parse_args()

    args.results_dir.mkdir(parents=True, exist_ok=True)
    answers_path = args.answers or run_pipeline(
        args.dataset,
        args.results_dir,
        limit=args.limit,
        bm25_store=args.bm25_store,
        resume=not args.no_resume,
        retry_errors=args.retry_errors,
    )
    if not args.skip_ragas:
        evaluate_with_ragas(answers_path, args.results_dir)


if __name__ == "__main__":
    main()
