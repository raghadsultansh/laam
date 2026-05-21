# LAAM — Deployment Guide

## Overview

| Service | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Auto-deploy from `main` branch |
| Backend | Railway | Docker-based, always-on |
| Database + Auth | Supabase | Managed PostgreSQL + Auth |
| Vector Store | Qdrant Cloud | Pre-ingested before go-live |
| File Storage | Supabase Storage | `report-pdfs` bucket |

---

## Prerequisites

- GitHub repo connected to Vercel and Railway
- Supabase project created and schema applied (`supabase/schema.sql`)
- Qdrant Cloud cluster running
- OpenAI API key with GPT-4o and `text-embedding-3-large` access

---

## 1. Database Setup (Supabase)

1. Create a new Supabase project
2. Open the SQL editor and run `supabase/schema.sql` in full
3. Enable Google OAuth under **Authentication → Providers → Google**
4. Add your deployed frontend URL to **Authentication → URL Configuration → Redirect URLs**
5. Create a `report-pdfs` storage bucket (public read, authenticated write)

---

## 2. Backend Deployment (Railway)

### Environment Variables

Set these in Railway → your service → **Variables**:

```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
JWT_SECRET=<Supabase JWT secret>
OPENAI_API_KEY=<your key>
LLM_MODEL=gpt-4o
EMBEDDING_MODEL=text-embedding-3-large
QDRANT_HOST=https://<cluster>.qdrant.io
QDRANT_API_KEY=<your key>
QDRANT_PORT=6333
FRONTEND_URL=https://<your-vercel-domain>.vercel.app
CORS_ORIGINS=https://<your-vercel-domain>.vercel.app
LOG_LEVEL=INFO
```

### Deploy

```bash
# Railway auto-detects the Dockerfile in /backend
# Point Railway root directory to: backend/
# Start command (in Dockerfile or Railway settings):
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Railway will build the Docker image and deploy. Note the public URL — you'll need it for the frontend.

---

## 3. Frontend Deployment (Vercel)

### Environment Variables

Set these in Vercel → your project → **Settings → Environment Variables**:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
NEXT_PUBLIC_BACKEND_URL=https://<your-railway-domain>.railway.app
```

### Deploy

```bash
# Connect GitHub repo to Vercel
# Framework: Next.js (auto-detected)
# Root directory: frontend/
# Build command: npm run build   (auto-detected)
# Output directory: .next        (auto-detected)
```

Push to `main` — Vercel deploys automatically.

---

## 4. Pre-Ingest Demo Reports

Before going live, run the ingestion script to populate Qdrant with the demo reports so the chat works immediately without uploads:

```bash
cd scripts/
pip install -r ../backend/requirements.txt
python ingest_demo_reports.py
```

The script reads report PDFs from a local folder, runs them through the pipeline, and writes vectors to Qdrant Cloud.

---

## 5. Post-Deployment Checklist

- [ ] Frontend loads at Vercel URL
- [ ] Backend `/health` returns `{"status": "ok"}`
- [ ] Google OAuth redirects correctly back to the app
- [ ] Can browse reports page without login
- [ ] Can start a session and ask a question
- [ ] Evidence panel shows source citations
- [ ] Dashboard KPI generation works on at least one report
- [ ] Admin panel accessible with admin email
- [ ] Arabic RTL layout renders correctly

---

## Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

Copy `.env.example` to `.env` in both `backend/` and the root, then fill in your keys.
