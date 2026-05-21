# LAAM — System Architecture

## Overview

LAAM is a bilingual (Arabic/English) AI platform for understanding Saudi annual financial reports. Users upload or browse PDF reports, ask natural language questions, and receive source-backed answers extracted via a Retrieval-Augmented Generation (RAG) pipeline. A financial dashboard with KPI extraction is also available.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User (Browser)                           │
│              Next.js 14 App Router — Vercel                     │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS REST
┌────────────────────────────▼────────────────────────────────────┐
│                     FastAPI Backend — Railway                    │
│  /api/v1/auth   /api/v1/reports   /api/v1/sessions              │
│  /api/v1/chat   /api/v1/dashboard  /api/v1/admin                │
└───────┬─────────────────┬──────────────────────┬────────────────┘
        │                 │                      │
┌───────▼──────┐  ┌───────▼──────┐  ┌───────────▼──────────────┐
│   Supabase   │  │    Qdrant    │  │       OpenAI API          │
│  PostgreSQL  │  │ Vector Store │  │  GPT-4o (generation)      │
│  Auth + RLS  │  │ BM25 + Dense │  │  text-embedding-3-large   │
│  Storage     │  │ + Reranker   │  └──────────────────────────┘
└──────────────┘  └──────────────┘
```

---

## Components

### Frontend (`/frontend`)
- **Framework**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **State**: React `useState` / `useEffect` hooks (no external state library)
- **Auth**: Supabase JS client (`@supabase/supabase-js`)
- **Bilingual**: Full Arabic (RTL) and English (LTR) support via locale context
- **Key pages**:
  - `/` — Landing page with animated hero, features, how-it-works sections
  - `/reports` — Public report browser grouped by company
  - `/workspace/[workspaceId]` — AI chat workspace with evidence panel and KPI dashboard
  - `/about` — Team and contact page

### Backend (`/backend`)
- **Framework**: FastAPI (Python 3.11+)
- **Auth**: Supabase JWT verification on every protected route
- **Key routers**:
  - `auth.py` — OAuth and session management
  - `reports.py` — PDF upload with SHA-256 deduplication, background processing
  - `sessions.py` — Chat session CRUD
  - `chat.py` — RAG query endpoint, chat history persistence
  - `dashboard.py` — KPI extraction and caching
  - `admin.py` — Admin panel (company/report/user management)

### AI Pipeline (`/backend/app/ai_pipeline`)

The pipeline runs entirely within the backend process:

```
PDF Upload
    │
    ▼
doc_parser.py          — Docling-based PDF parsing (text + tables + structure)
    │
    ▼
chunker.py             — Hierarchical chunking (section → paragraph → sentence)
    │
    ├──► Qdrant         — Dense vector index (text-embedding-3-large, 3072-dim)
    └──► BM25           — Sparse keyword index (pickle, per-document)
         │
         ▼
vector_store.py        — Hybrid retrieval: dense + BM25 → CrossEncoder reranker
         │
         ▼
prompts.py             — Chain-of-Thought prompt templates (AR + EN)
         │
         ▼
llm.py (AnswerGenerator) — GPT-4o generates answer with inline citations
         │
         ▼
judge.py (EvidenceJudge)  — Quality scoring and confidence assessment
```

### Database (Supabase PostgreSQL)

Key tables:
| Table | Purpose |
|---|---|
| `companies` | Company metadata (name AR/EN, sector, logo) |
| `reports` | Report records (status, file hash, fiscal year) |
| `sessions` | Chat sessions linked to a report |
| `processing_jobs` | Real-time processing progress tracking |
| `report_dashboards` | Cached KPI extraction results |

Row-Level Security (RLS) is enabled on all tables. See `supabase/schema.sql`.

### Storage
- **Supabase Storage** (`report-pdfs` bucket): original PDF files, keyed by SHA-256 hash
- **Qdrant Cloud**: dense vector index — one collection per report, scoped by `doc_hash`
- **BM25 pickle store**: local to the backend process (`bm25_store/` directory)

---

## Data Flow — Question Answering

1. User types a question in the workspace chat
2. Frontend `POST /api/v1/sessions/{id}/chat` with `{ question }`
3. Backend fetches the report's `qdrant_collection_id` (= file hash)
4. `vector_store.py` runs hybrid retrieval (dense + BM25), reranks with CrossEncoder
5. Top-k chunks are assembled into a CoT prompt (`prompts.py`)
6. `AnswerGenerator` calls GPT-4o, streams back answer with source citations
7. `EvidenceJudge` scores the answer quality
8. Response `{ answer, sources, confidence }` is saved to `chat_history` in Supabase
9. Frontend renders `MessageBubble` with source highlights in the `EvidencePanel`

---

## Research (`/research`)

- **Dataset**: 3,498 financial QA pairs generated from TAT-QA using Gemini 2.5 Flash, validated with a 5-layer rule-based filter and Claude Sonnet judge
- **Fine-tuning**: QLoRA fine-tuning experiments on Qwen2.5-7B, Llama-3.1-8B, DeepSeek-R1-Distill-Qwen-7B
- **Evaluation**: RAGAS framework used to benchmark retrieval and generation quality against GPT-4o baseline

---

## Security

- All API keys stored in environment variables (never committed)
- Supabase RLS enforces data isolation between users
- PDF uploads validated by magic bytes (not just file extension)
- SHA-256 deduplication prevents redundant storage and processing
- Admin routes protected by email allowlist + Supabase JWT
