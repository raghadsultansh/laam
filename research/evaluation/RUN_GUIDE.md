# RAGAS Evaluation Run Guide

This folder is intentionally separate from the website structure. It does not change `frontend`, `backend`, `supabase`, or the app pipeline.

## Quick retrieval evaluation

Run this from the project root:

```powershell
python RAGAS\scripts\run_retrieval_eval.py
```

Outputs are written to:

- `RAGAS\results\retrieval_results.csv`
- `RAGAS\results\ragas_retrieval_results.xlsx`
- `RAGAS\results\retrieval_summary.json`
- `RAGAS\results\evaluation_report.md`
- `RAGAS\results\ragas_input_contexts.csv`

The Excel and CSV files are the easiest ones to download/use in the graduation report.

## Full RAGAS generation evaluation

After you commit/merge to `main`, make sure:

1. The reports are indexed and ready in Qdrant.
2. `.env` has valid `OPENAI_API_KEY`, `QDRANT_HOST`, and `QDRANT_API_KEY`.
3. Dependencies are installed:

```powershell
python -m pip install -r RAGAS\requirements.txt
```

Then run:

```powershell
python RAGAS\scripts\run_pipeline_and_ragas.py
```

This will call the actual backend RAG pipeline for every question, collect generated answers and contexts, then compute RAGAS:

- Faithfulness
- Answer relevancy
- Context precision
- Context recall
- Answer correctness

Outputs:

- `RAGAS\results\pipeline_answers_for_ragas.csv`
- `RAGAS\results\ragas_generation_scores.csv`
- `RAGAS\results\ragas_generation_scores.xlsx`
- `RAGAS\results\ragas_generation_summary.json`

## Adding more questions

Edit:

```powershell
RAGAS\data\evaluation_questions.csv
```


