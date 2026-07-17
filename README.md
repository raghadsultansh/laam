# LAAM — لّام

> مُلِمّ لتقاريرك المالية &nbsp;·&nbsp; Deeply knowledgeable about your financial reports

LAAM is an AI-powered platform for analyzing annual financial reports from Saudi-listed companies. Upload a PDF report, ask questions in Arabic or English, and get answers grounded in the actual document — complete with source citations, KPI extraction, and a financial dashboard.

**Live demo:** https://laam-seven.vercel.app/

---

## What it does

- Browse pre-loaded annual reports from Saudi-listed companies
- Ask questions in Arabic or English and get cited, grounded answers
- View an auto-generated financial dashboard with KPIs and year-over-year trends
- Upload your own PDF and start analyzing it immediately
- Save and revisit analysis sessions in a persistent workspace

---

## How it works

Each uploaded PDF goes through a three-stage AI pipeline:

1. **Parsing** — Docling extracts text, tables, and document structure from the PDF, preserving layout and table relationships that standard parsers lose
2. **Indexing** — Chunks are stored in both Qdrant (dense vectors via `text-embedding-3-large`) and BM25 (keyword index), enabling hybrid retrieval at query time
3. **Answering** — Hybrid retrieval + CrossEncoder reranking selects the most relevant evidence, GPT-4o generates a grounded cited answer, and an EvidenceJudge scores the response confidence

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.11, Pydantic v2 |
| AI Pipeline | Docling, Qdrant, LangChain, GPT-4o, sentence-transformers (CrossEncoder) |
| Database | Supabase (PostgreSQL + RLS + Auth) |
| Storage | Supabase Storage (PDFs), Qdrant Cloud (vectors) |
| Deployment | Vercel (frontend), Railway (backend) |

---

## Repository structure

```
frontend/     Next.js web application
backend/      FastAPI REST API and AI pipeline
research/     Dataset generation, fine-tuning notebooks, RAGAS evaluation
supabase/     Database schema and RLS policies
docs/         Architecture and deployment guides
scripts/      Report ingestion utilities
```

---

## Local development

**Prerequisites:** Python 3.11+, Node.js 18+, and credentials for Supabase, Qdrant Cloud, and OpenAI.

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
                       # JWT_SECRET, OPENAI_API_KEY, QDRANT_HOST, QDRANT_API_KEY
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Check `http://localhost:8000/docs` for the interactive Swagger UI.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
                              # NEXT_PUBLIC_BACKEND_URL
npm run dev
```

The app will be available at `http://localhost:3000`.

For full production deployment instructions (Railway + Vercel + Supabase + Qdrant), see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## Research

As part of this project, we built a financial QA dataset and ran fine-tuning experiments to evaluate whether open-source models could match GPT-4o in the reasoning layer.

- **Dataset:** 3,498 QA pairs generated from TAT-QA using Gemini 2.5 Flash, filtered through a 5-layer validation pipeline and a Claude Sonnet quality judge
- **Models fine-tuned:** Qwen2.5-7B, Llama-3.1-8B, DeepSeek-R1-Distill-Qwen-7B (QLoRA, 4-bit NF4 quantization)
- **Best result:** Qwen2.5-7B reached **85.2% F1** and **84.4% numeric exact match** on the TAT-QA benchmark
- **Pipeline evaluation (RAGAS):** Faithfulness 82.8%, Answer relevancy 80.3%, Context precision 79.5%

Training notebooks and evaluation scripts are in `research/`.

---

## Team

**Nouf Turki Alnagaidan**  
**Latifa Hassan Altuwairqi**  
**Raghad Sultan Alshanar**



---

## License

This project was developed as a graduation project at Imam Mohammad Ibn Saud Islamic University. All rights reserved.

This repository is made publicly available for academic review only. The source code, system design, research, and any other materials in this repository may not be copied, reused, modified, or distributed — in whole or in part — without explicit written permission from the authors.

Copyright (c) 2026 Nouf Turki Alnagaidan, Latifa Hassan Altuwairqi, Raghad Sultan Alshanar. All rights reserved.
