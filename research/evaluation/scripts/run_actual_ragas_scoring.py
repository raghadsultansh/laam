from __future__ import annotations

import argparse
import json
import math
import time
from pathlib import Path

import pandas as pd
from datasets import Dataset
from dotenv import load_dotenv
from ragas import evaluate
from ragas.embeddings import LangchainEmbeddingsWrapper
from ragas.llms import LangchainLLMWrapper
from ragas.run_config import RunConfig


ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = ROOT.parent
DEFAULT_ANSWERS = ROOT / "results" / "pipeline_answers_for_ragas.csv"
DEFAULT_RESULTS = ROOT / "results" / "actual_ragas"


def load_answers(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    if "error" in df.columns:
        df = df[df["error"].fillna("") == ""].copy()
    df["retrieved_contexts"] = df["contexts"].apply(json.loads)
    df["user_input"] = df["question"]
    df["response"] = df["answer"]
    df["reference"] = df["ground_truth"]
    return df


def metric_objects():
    # Deprecated import path still works in ragas 0.4.3 and keeps compatibility
    # with this installed environment.
    from ragas.metrics import (
        answer_correctness,
        answer_relevancy,
        context_precision,
        context_recall,
        faithfulness,
    )

    return [
        faithfulness,
        answer_relevancy,
        context_precision,
        context_recall,
        answer_correctness,
    ]


def evaluator_models():
    from langchain_openai import ChatOpenAI, OpenAIEmbeddings

    llm = LangchainLLMWrapper(
        ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0,
            timeout=180,
            max_retries=4,
        )
    )
    embeddings = LangchainEmbeddingsWrapper(
        OpenAIEmbeddings(
            model="text-embedding-3-small",
            timeout=180,
            max_retries=4,
        )
    )
    return llm, embeddings


def completed_ids(path: Path) -> set[str]:
    if not path.exists():
        return set()
    done = pd.read_csv(path)
    if "id" not in done.columns:
        return set()
    return set(done["id"].astype(str))


def append_csv(path: Path, frame: pd.DataFrame) -> None:
    write_header = not path.exists()
    frame.to_csv(path, mode="a", header=write_header, index=False, encoding="utf-8-sig")


def summarize(results_path: Path, output_dir: Path, source_answers: pd.DataFrame) -> dict:
    scored = pd.read_csv(results_path)
    metric_cols = [
        col
        for col in [
            "faithfulness",
            "answer_relevancy",
            "context_precision",
            "context_recall",
            "answer_correctness",
        ]
        if col in scored.columns
    ]
    summary = {
        "evaluated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "questions_in_answer_file": int(len(source_answers)),
        "questions_scored_by_ragas": int(len(scored)),
        "average_response_seconds": round(float(source_answers["response_seconds"].mean()), 4)
        if "response_seconds" in source_answers.columns
        else None,
    }
    for col in metric_cols:
        summary[col] = round(float(pd.to_numeric(scored[col], errors="coerce").mean()), 4)
    if "answer_correctness" in summary:
        summary["ragas_accuracy_percent"] = round(summary["answer_correctness"] * 100, 2)

    by_report = scored.groupby("report")[metric_cols].mean(numeric_only=True).round(4)
    by_type = scored.groupby("type")[metric_cols].mean(numeric_only=True).round(4)
    by_difficulty = scored.groupby("difficulty")[metric_cols].mean(numeric_only=True).round(4)

    summary_path = output_dir / "ragas_summary.json"
    xlsx_path = output_dir / "ragas_report.xlsx"
    md_path = output_dir / "ragas_report.md"
    html_path = output_dir / "ragas_report.html"

    summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    with pd.ExcelWriter(xlsx_path, engine="openpyxl") as writer:
        pd.DataFrame([summary]).to_excel(writer, sheet_name="summary", index=False)
        scored.to_excel(writer, sheet_name="question_scores", index=False)
        by_report.to_excel(writer, sheet_name="by_report")
        by_type.to_excel(writer, sheet_name="by_type")
        by_difficulty.to_excel(writer, sheet_name="by_difficulty")

    lines = [
        "# Actual RAGAS Evaluation Report",
        "",
        f"Generated: {summary['evaluated_at']}",
        "",
        "## Summary",
        "",
        f"- Questions in answer file: {summary['questions_in_answer_file']}",
        f"- Questions scored by RAGAS: {summary['questions_scored_by_ragas']}",
    ]
    for col in metric_cols:
        lines.append(f"- {col}: {summary[col]}")
    if "ragas_accuracy_percent" in summary:
        lines.append(f"- RAGAS answer correctness percent: {summary['ragas_accuracy_percent']}%")
    lines.append(f"- Average pipeline response time: {summary['average_response_seconds']} seconds")
    lines.extend(
        [
            "",
            "## Method",
            "",
            "This report was produced by RAGAS using the saved outputs from the real RAG pipeline. "
            "The dataset schema passed to RAGAS used `user_input`, `response`, `retrieved_contexts`, and `reference`.",
        ]
    )
    md_path.write_text("\n".join(lines), encoding="utf-8")

    html_path.write_text(
        "<!doctype html><html><head><meta charset='utf-8'><title>Actual RAGAS Evaluation</title>"
        "<style>body{font-family:Arial,sans-serif;margin:32px;color:#17202a;line-height:1.45}"
        ".metric{display:inline-block;margin:8px 12px 8px 0;padding:12px 14px;border:1px solid #d8dee6;border-radius:8px}"
        ".metric b{display:block;font-size:22px}table{border-collapse:collapse;width:100%;font-size:13px}"
        "th,td{border:1px solid #d8dee6;padding:8px;vertical-align:top}th{background:#f3f6f9}</style></head><body>"
        "<h1>Actual RAGAS Evaluation Report</h1>"
        f"<p>Generated: {summary['evaluated_at']}</p>"
        + "".join(f"<div class='metric'>{col}<b>{summary[col]}</b></div>" for col in metric_cols)
        + "<h2>By Report</h2>"
        + by_report.to_html()
        + "<h2>Question Scores</h2>"
        + scored[["id", "report", "difficulty", "type", *metric_cols]].to_html(index=False)
        + "</body></html>",
        encoding="utf-8",
    )
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Run actual RAGAS scoring on saved pipeline answers.")
    parser.add_argument("--answers", type=Path, default=DEFAULT_ANSWERS)
    parser.add_argument("--results-dir", type=Path, default=DEFAULT_RESULTS)
    parser.add_argument("--batch-size", type=int, default=5)
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--no-resume", action="store_true")
    args = parser.parse_args()

    load_dotenv(PROJECT_ROOT / ".env")
    load_dotenv(PROJECT_ROOT / "backend" / ".env")
    args.results_dir.mkdir(parents=True, exist_ok=True)

    source = load_answers(args.answers)
    if args.limit is not None:
        source = source.head(args.limit).copy()

    scores_path = args.results_dir / "ragas_scores.csv"
    if args.no_resume and scores_path.exists():
        scores_path.unlink()
    done = completed_ids(scores_path)

    metrics = metric_objects()
    llm, embeddings = evaluator_models()
    run_config = RunConfig(timeout=240, max_retries=6, max_wait=30, max_workers=2)
    pending = source[~source["id"].astype(str).isin(done)].copy()

    for start in range(0, len(pending), args.batch_size):
        batch = pending.iloc[start : start + args.batch_size].copy()
        records = batch[
            ["user_input", "response", "retrieved_contexts", "reference"]
        ].to_dict(orient="records")
        dataset = Dataset.from_list(records)
        print(f"Scoring batch {start + 1}-{start + len(batch)} of {len(pending)}")
        result = evaluate(
            dataset,
            metrics=metrics,
            llm=llm,
            embeddings=embeddings,
            run_config=run_config,
            raise_exceptions=False,
            show_progress=True,
        )
        scored = result.to_pandas()
        meta = batch[
            [
                "id",
                "company",
                "report",
                "language",
                "type",
                "difficulty",
                "question",
                "ground_truth",
                "response_seconds",
            ]
        ].reset_index(drop=True)
        output = pd.concat([meta, scored.reset_index(drop=True)], axis=1)
        append_csv(scores_path, output)

    summary = summarize(scores_path, args.results_dir, source)
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    print(f"Wrote actual RAGAS resources to {args.results_dir}")


if __name__ == "__main__":
    main()
