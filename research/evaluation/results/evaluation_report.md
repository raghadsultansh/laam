# RAG Evaluation Report

Generated: 2026-05-12 06:43:33

## Scope

This run evaluates retrieval quality using the existing cached report chunks. It does not modify the website code or re-ingest PDFs.

## Dataset

- Test questions: 23
- Companies: Al Rajhi Bank, Saudi Aramco
- Top-k: 5
- BM25 cache used: `C:\Users\rssh1\Desktop\GP website\.claude\worktrees\nostalgic-chebyshev-baa26e\backend\app\ai_pipeline\bm25_store`

## Results

- Precision@k: 0.6261
- Recall@k: 0.7329
- MRR: 0.9275
- Average retrieval time: 0.0713 seconds/query
- English Precision@k: 0.6105
- Arabic Precision@k: 0.7
- English MRR: 0.9123
- Arabic MRR: 1.0

## Notes For The Graduation Report

- Precision@k, Recall@k, and MRR are computed from retrieved chunks and manually curated evidence terms.
- RAGAS generation metrics require actual generated answers from the running RAG pipeline. Use `scripts/run_pipeline_and_ragas.py` after the reports are indexed and API keys are available.
- Downloadable files are in this `results` folder: CSV, XLSX, JSON, and Markdown.
