from __future__ import annotations

import argparse
import json
import re
import time
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATASET = ROOT / "data" / "real_financial_report_dataset_with_hashes.csv"
DEFAULT_ANSWERS = ROOT / "results" / "pipeline_answers_for_ragas.csv"
DEFAULT_RESULTS = ROOT / "results"


STOPWORDS = {
    "the", "a", "an", "and", "or", "of", "to", "in", "for", "on", "by", "with",
    "was", "were", "is", "are", "what", "how", "did", "from", "as", "at", "it",
    "this", "that", "according", "based", "year", "2024", "2025", "sar", "usd",
}


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", str(text or "").lower()).strip()


def tokens(text: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[a-zA-Z0-9]+(?:\.[0-9]+)?%?", normalize(text))
        if len(token) > 1 and token not in STOPWORDS
    }


def numbers(text: str) -> set[str]:
    out = set()
    for raw in re.findall(r"\(?\$?\b\d[\d,]*(?:\.\d+)?%?\)?", str(text or "")):
        cleaned = raw.strip("()$ ").replace(",", "")
        out.add(cleaned)
    return out


def evidence_terms(text: str) -> list[str]:
    terms: list[str] = []
    for part in re.split(r"[;./]| and |, ", str(text or "")):
        part = part.strip()
        if len(part) >= 4:
            terms.append(part)
    if not terms and text:
        terms = [str(text)]
    return terms[:12]


def overlap_score(expected: str, actual: str) -> float:
    expected_nums = numbers(expected)
    actual_nums = numbers(actual)
    numeric_score = len(expected_nums & actual_nums) / len(expected_nums) if expected_nums else 1.0

    expected_tokens = tokens(expected)
    actual_tokens = tokens(actual)
    token_score = len(expected_tokens & actual_tokens) / len(expected_tokens) if expected_tokens else 1.0

    if expected_nums:
        return round((0.65 * numeric_score) + (0.35 * token_score), 4)
    return round(token_score, 4)


def context_recall_score(supporting_evidence: str, contexts_text: str) -> float:
    support_nums = numbers(supporting_evidence)
    context_nums = numbers(contexts_text)
    numeric_score = len(support_nums & context_nums) / len(support_nums) if support_nums else 1.0

    support_tokens = tokens(supporting_evidence)
    context_tokens = tokens(contexts_text)
    token_score = len(support_tokens & context_tokens) / len(support_tokens) if support_tokens else 0.0

    if support_nums:
        return round((0.55 * numeric_score) + (0.45 * token_score), 4)
    return round(token_score, 4)


def context_precision_score(supporting_evidence: str, contexts: list[str]) -> float:
    if not contexts:
        return 0.0
    relevant = 0
    support_nums = numbers(supporting_evidence)
    support_tokens = tokens(supporting_evidence)
    for context in contexts:
        c_nums = numbers(context)
        c_tokens = tokens(context)
        num_hit = bool(support_nums & c_nums) if support_nums else False
        token_hit = (len(support_tokens & c_tokens) / len(support_tokens)) >= 0.18 if support_tokens else False
        if num_hit or token_hit:
            relevant += 1
    return round(relevant / len(contexts), 4)


def faithfulness_proxy(answer: str, contexts_text: str) -> float:
    answer_nums = numbers(answer)
    context_nums = numbers(contexts_text)
    numeric_score = len(answer_nums & context_nums) / len(answer_nums) if answer_nums else 1.0
    answer_tokens = tokens(answer)
    context_tokens = tokens(contexts_text)
    token_score = len(answer_tokens & context_tokens) / len(answer_tokens) if answer_tokens else 0.0
    return round((0.6 * numeric_score) + (0.4 * token_score), 4)


def answer_relevance_score(question: str, answer: str) -> float:
    q_tokens = tokens(question)
    a_tokens = tokens(answer)
    return round(len(q_tokens & a_tokens) / len(q_tokens), 4) if q_tokens else 0.0


def label(score: float) -> str:
    if score >= 0.85:
        return "Strong"
    if score >= 0.70:
        return "Good"
    if score >= 0.55:
        return "Needs review"
    return "Weak"


def main() -> None:
    parser = argparse.ArgumentParser(description="Deterministically evaluate saved RAG answers.")
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
    parser.add_argument("--answers", type=Path, default=DEFAULT_ANSWERS)
    parser.add_argument("--results-dir", type=Path, default=DEFAULT_RESULTS)
    args = parser.parse_args()
    args.results_dir.mkdir(parents=True, exist_ok=True)

    dataset = pd.read_csv(args.dataset)
    answers = pd.read_csv(args.answers)
    answers["error"] = answers.get("error", "").fillna("")
    merged = answers.merge(
        dataset[
            [
                "id",
                "supporting_evidence",
                "page_number",
                "expected_source_section",
                "difficulty",
            ]
        ],
        on="id",
        how="left",
        suffixes=("", "_dataset"),
    )

    rows = []
    for _, row in merged.iterrows():
        contexts = json.loads(row["contexts"]) if isinstance(row["contexts"], str) and row["contexts"].strip() else []
        contexts_text = " ".join(contexts)
        correctness = overlap_score(row["ground_truth"], row["answer"])
        context_recall = context_recall_score(row["supporting_evidence"], contexts_text)
        context_precision = context_precision_score(row["supporting_evidence"], contexts)
        faithfulness = faithfulness_proxy(row["answer"], contexts_text)
        relevance = answer_relevance_score(row["question"], row["answer"])
        overall = round(
            (0.35 * correctness)
            + (0.25 * context_recall)
            + (0.15 * context_precision)
            + (0.15 * faithfulness)
            + (0.10 * relevance),
            4,
        )
        rows.append(
            {
                **row.to_dict(),
                "answer_correctness_score": correctness,
                "answer_relevance_score": relevance,
                "faithfulness_proxy_score": faithfulness,
                "context_precision_score": context_precision,
                "context_recall_score": context_recall,
                "overall_score": overall,
                "overall_label": label(overall),
                "context_count": len(contexts),
            }
        )

    scored = pd.DataFrame(rows)
    metric_cols = [
        "answer_correctness_score",
        "answer_relevance_score",
        "faithfulness_proxy_score",
        "context_precision_score",
        "context_recall_score",
        "overall_score",
    ]
    summary = {
        "evaluated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "questions": int(len(scored)),
        "answered": int((scored["error"].fillna("") == "").sum()),
        "failed": int((scored["error"].fillna("") != "").sum()),
        "average_response_seconds": round(float(scored["response_seconds"].mean()), 4),
    }
    summary.update({col: round(float(scored[col].mean()), 4) for col in metric_cols})
    summary["approximate_accuracy_percent"] = round(summary["overall_score"] * 100, 2)

    by_report = scored.groupby("report")[metric_cols + ["response_seconds"]].mean().round(4)
    by_type = scored.groupby("type")[metric_cols].mean().round(4)
    by_difficulty = scored.groupby("difficulty")[metric_cols].mean().round(4)

    scored_path = args.results_dir / "final_answer_evaluation_scores.csv"
    xlsx_path = args.results_dir / "final_answer_evaluation_report.xlsx"
    json_path = args.results_dir / "final_answer_evaluation_summary.json"
    md_path = args.results_dir / "final_answer_evaluation_report.md"
    html_path = args.results_dir / "final_answer_evaluation_report.html"

    scored.to_csv(scored_path, index=False, encoding="utf-8-sig")
    json_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")

    with pd.ExcelWriter(xlsx_path, engine="openpyxl") as writer:
        pd.DataFrame([summary]).to_excel(writer, sheet_name="summary", index=False)
        scored.to_excel(writer, sheet_name="question_scores", index=False)
        by_report.to_excel(writer, sheet_name="by_report")
        by_type.to_excel(writer, sheet_name="by_type")
        by_difficulty.to_excel(writer, sheet_name="by_difficulty")

    md = [
        "# Final RAG Evaluation Report",
        "",
        f"Generated: {summary['evaluated_at']}",
        "",
        "## Summary",
        "",
        f"- Questions evaluated: {summary['questions']}",
        f"- Successful pipeline answers: {summary['answered']}",
        f"- Failed pipeline answers: {summary['failed']}",
        f"- Approximate answer accuracy: {summary['approximate_accuracy_percent']}%",
        f"- Overall score: {summary['overall_score']}",
        f"- Answer correctness: {summary['answer_correctness_score']}",
        f"- Answer relevance: {summary['answer_relevance_score']}",
        f"- Faithfulness proxy: {summary['faithfulness_proxy_score']}",
        f"- Context precision: {summary['context_precision_score']}",
        f"- Context recall: {summary['context_recall_score']}",
        f"- Average response time: {summary['average_response_seconds']} seconds",
        "",
        "## Method Note",
        "",
        "This final report uses deterministic scoring over the saved outputs from the real RAG pipeline. "
        "It compares generated answers to ground-truth answers and supporting evidence from the financial reports. "
        "This avoids another fragile live RAGAS evaluator run while still evaluating the actual system answers.",
    ]
    md_path.write_text("\n".join(md), encoding="utf-8")

    html_path.write_text(
        "<!doctype html><html><head><meta charset='utf-8'><title>Final RAG Evaluation</title>"
        "<style>body{font-family:Arial,sans-serif;margin:32px;color:#17202a;line-height:1.45}"
        ".metric{display:inline-block;margin:8px 12px 8px 0;padding:12px 14px;border:1px solid #d8dee6;border-radius:8px}"
        ".metric b{display:block;font-size:22px}table{border-collapse:collapse;width:100%;font-size:13px}"
        "th,td{border:1px solid #d8dee6;padding:8px;vertical-align:top}th{background:#f3f6f9}</style></head><body>"
        "<h1>Final RAG Evaluation Report</h1>"
        f"<p>Generated: {summary['evaluated_at']}</p>"
        f"<div class='metric'>Approx. Accuracy<b>{summary['approximate_accuracy_percent']}%</b></div>"
        f"<div class='metric'>Overall Score<b>{summary['overall_score']}</b></div>"
        f"<div class='metric'>Correctness<b>{summary['answer_correctness_score']}</b></div>"
        f"<div class='metric'>Context Recall<b>{summary['context_recall_score']}</b></div>"
        f"<div class='metric'>Faithfulness Proxy<b>{summary['faithfulness_proxy_score']}</b></div>"
        "<h2>By Report</h2>"
        + by_report.to_html()
        + "<h2>Question Scores</h2>"
        + scored[
            [
                "id",
                "report",
                "difficulty",
                "type",
                "overall_score",
                "overall_label",
                "answer_correctness_score",
                "context_recall_score",
                "faithfulness_proxy_score",
                "response_seconds",
            ]
        ].to_html(index=False)
        + "</body></html>",
        encoding="utf-8",
    )

    print(json.dumps(summary, indent=2, ensure_ascii=False))
    print(f"Wrote {xlsx_path}")


if __name__ == "__main__":
    main()
