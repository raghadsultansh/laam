# RAGAS Evaluation Folder

Purpose: evaluate the LAAM RAG pipeline without touching the website code.

Current contents:

- `data/evaluation_questions.csv` - curated test questions and ground truths.
- `scripts/run_retrieval_eval.py` - offline retrieval metrics from cached chunks.
- `scripts/run_pipeline_and_ragas.py` - full pipeline + RAGAS generation metrics.
- `results/` - generated reports, spreadsheets, and JSON summaries.
- `RUN_GUIDE.md` - exact commands to run now or after merging to main.

Start with:

```powershell
python RAGAS\scripts\run_retrieval_eval.py
```
