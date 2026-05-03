# LAAM — لّام

> مُلِمّ لتقاريرك المالية &nbsp;·&nbsp; Deeply knowledgeable about your financial reports

LAAM is an AI-powered platform for analyzing IFRS-compliant annual financial reports from Saudi-listed companies. It transforms complex financial disclosures into an interactive analytical experience — grounded answers with source citations, KPI extraction, and cross-report comparison through natural language.

## Features

- Upload annual financial reports (PDF)
- Ask natural-language questions and receive grounded, cited answers
- Extract and visualize key financial indicators (KPIs)
- Compare reports across years or companies
- Save analysis sessions in a persistent workspace notebook

## Architecture

Built around a three-layer AI pipeline:

| Layer | Responsibility |
|-------|---------------|
| **Perception** | PDF extraction, table detection, layout analysis |
| **Understanding** | Semantic structuring, section classification, hierarchical chunking |
| **Reasoning** | Hybrid RAG retrieval, reranking, grounded answer generation |

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python, SQLAlchemy, Alembic |
| AI Pipeline | Docling, Qdrant, LangChain, GPT-4o, BAAI/bge-reranker |
| Database | Supabase (PostgreSQL) |
| Auth | Firebase |

## Repository Structure

```
frontend/    — Next.js web application
backend/     — FastAPI REST API
ai/          — RAG pipeline (perception · understanding · reasoning)
supabase/    — Database schema and RLS policies
shared/      — Shared types and API contracts
docs/        — Architecture and API documentation
```

## Status

Active development — Graduation Project, 2026.
