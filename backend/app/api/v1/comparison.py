from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.dependencies import get_current_user
from app.db.supabase import supabase
import app.ai_pipeline.adapter as pipeline

router = APIRouter()


class CreateComparisonSession(BaseModel):
    report_ids: list[str]
    title: str | None = None


class ComparisonChatRequest(BaseModel):
    question: str


@router.post("/comparison-sessions")
async def create_comparison_session(
    body: CreateComparisonSession,
    user: dict = Depends(get_current_user),
):
    if len(body.report_ids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 reports required")
    if len(body.report_ids) > 4:
        raise HTTPException(status_code=400, detail="Maximum 4 reports allowed")

    # Fetch report + company info for all IDs
    result = (
        supabase.table("reports")
        .select("id, fiscal_year, title, file_hash_sha256, qdrant_collection_id, status, companies(id, name_en, name_ar, sector, logo_url)")
        .in_("id", body.report_ids)
        .execute()
    )
    if not result or not result.data:
        raise HTTPException(status_code=404, detail="Reports not found")

    reports = result.data
    companies = [
        {
            "report_id": r["id"],
            "fiscal_year": r.get("fiscal_year"),
            "company": r.get("companies"),
        }
        for r in reports
    ]

    auto_title = " vs ".join(
        f"{r.get('companies', {}).get('name_en', 'Unknown')} {r.get('fiscal_year', '')}"
        for r in reports
    )

    session_result = (
        supabase.table("comparison_sessions")
        .insert({
            "user_id": user["id"],
            "report_ids": body.report_ids,
            "title": body.title or auto_title,
        })
        .execute()
    )
    session = session_result.data[0]
    return {**session, "reports": reports}


@router.get("/comparison-sessions")
async def list_comparison_sessions(user: dict = Depends(get_current_user)):
    result = (
        supabase.table("comparison_sessions")
        .select("*")
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    sessions = result.data or []

    # Enrich each session with report info
    enriched = []
    for s in sessions:
        reports_result = (
            supabase.table("reports")
            .select("id, fiscal_year, title, companies(id, name_en, name_ar, logo_url)")
            .in_("id", s["report_ids"])
            .execute()
        )
        enriched.append({**s, "reports": reports_result.data or []})
    return enriched


@router.get("/comparison-sessions/{session_id}")
async def get_comparison_session(session_id: str, user: dict = Depends(get_current_user)):
    result = (
        supabase.table("comparison_sessions")
        .select("*")
        .eq("id", session_id)
        .single()
        .execute()
    )
    if not result or not result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    session = result.data
    reports_result = (
        supabase.table("reports")
        .select("id, fiscal_year, title, status, file_hash_sha256, qdrant_collection_id, companies(id, name_en, name_ar, sector, logo_url)")
        .in_("id", session["report_ids"])
        .execute()
    )
    return {**session, "reports": reports_result.data or []}


@router.get("/comparison-sessions/{session_id}/messages")
async def get_comparison_messages(session_id: str, user: dict = Depends(get_current_user)):
    result = (
        supabase.table("comparison_messages")
        .select("*")
        .eq("session_id", session_id)
        .order("created_at", asc=True)
        .execute()
    )
    return result.data or []


@router.post("/comparison-sessions/{session_id}/chat")
async def comparison_chat(
    session_id: str,
    body: ComparisonChatRequest,
    user: dict = Depends(get_current_user),
):
    # Get session + reports
    session_result = (
        supabase.table("comparison_sessions")
        .select("*")
        .eq("id", session_id)
        .single()
        .execute()
    )
    if not session_result or not session_result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    reports_result = (
        supabase.table("reports")
        .select("id, fiscal_year, status, qdrant_collection_id, file_hash_sha256, companies(name_en)")
        .in_("id", session_result.data["report_ids"])
        .execute()
    )
    reports = reports_result.data or []

    # Check all reports are ready and indexed
    not_ready = [r for r in reports if r.get("status") != "ready"]
    not_indexed = [r for r in reports if not (r.get("qdrant_collection_id") or r.get("file_hash_sha256"))]

    if not_ready or not_indexed:
        # Save user message
        supabase.table("comparison_messages").insert({
            "session_id": session_id,
            "role": "user",
            "content": body.question,
        }).execute()
        # Return a clear error state (not an HTTP error — just a structured response)
        error_msg = "بعض التقارير لم تتم فهرستها بعد. الرجاء إعادة رفع التقارير لتفعيل المقارنة.\n\nSome reports are not yet indexed. Please re-upload the reports to enable comparison chat."
        supabase.table("comparison_messages").insert({
            "session_id": session_id,
            "role": "assistant",
            "content": error_msg,
            "per_company_answers": None,
        }).execute()
        return {"answer": error_msg, "per_company": [], "synthesis": ""}

    # Build report contexts for multi-retrieval
    report_contexts = [
        {
            "report_id": r["id"],
            "doc_hash": r.get("qdrant_collection_id") or r.get("file_hash_sha256"),
            "company_name": (r.get("companies") or {}).get("name_en", "Unknown"),
            "fiscal_year": str(r.get("fiscal_year") or ""),
        }
        for r in reports
    ]

    # Save user message
    supabase.table("comparison_messages").insert({
        "session_id": session_id,
        "role": "user",
        "content": body.question,
    }).execute()

    # Run multi-report RAG
    result = pipeline.answer_question_multi(body.question, report_contexts)

    # Save assistant message
    supabase.table("comparison_messages").insert({
        "session_id": session_id,
        "role": "assistant",
        "content": result.get("synthesis", ""),
        "per_company_answers": result.get("per_company", []),
    }).execute()

    return result
