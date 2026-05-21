from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.dependencies import get_current_user, get_optional_user
from app.db.supabase import supabase

router = APIRouter()


class CreateSessionRequest(BaseModel):
    report_id: str


class UpdateTitleRequest(BaseModel):
    title: str


def _build_session_title(report_id: str) -> str:
    """Auto-generates session title from company name + fiscal year, falling back to file name."""
    result = (
        supabase.table("reports")
        .select("fiscal_year, title, file_name, companies(name_en)")
        .eq("id", report_id)
        .single()
        .execute()
    )
    if not result.data:
        return "New Session"
    report = result.data
    company_name = (report.get("companies") or {}).get("name_en", "")
    year = report.get("fiscal_year", "")
    if company_name and year:
        return f"{company_name} {year}"
    file_name = report.get("file_name") or ""
    if file_name:
        return file_name.rsplit(".", 1)[0] if "." in file_name else file_name
    return report.get("title") or "New Session"


@router.post("/sessions")
async def create_session(
    body: CreateSessionRequest,
    user: dict = Depends(get_optional_user),
):
    """
    Creates a new session linked to one report.
    Works for both logged-in users and guests (user_id = null for guests).
    """
    # Verify the report exists and is ready
    report = (
        supabase.table("reports")
        .select("id, status")
        .eq("id", body.report_id)
        .single()
        .execute()
    )
    if not report.data:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.data["status"] != "ready":
        raise HTTPException(status_code=400, detail="Report is not ready yet")

    title = _build_session_title(body.report_id)

    result = supabase.table("sessions").insert({
        "report_id": body.report_id,
        "user_id": user["id"] if user else None,
        "title": title,
        "chat_history": [],
        "is_saved": user is not None,
    }).execute()

    return result.data[0]


@router.get("/sessions")
async def list_sessions(user: dict = Depends(get_current_user)):
    """Returns all sessions for the logged-in user, newest first."""
    result = (
        supabase.table("sessions")
        .select("id, title, is_saved, created_at, updated_at, last_message_at, reports(id, status, fiscal_year, companies(name_en, name_ar, logo_url))")
        .eq("user_id", user["id"])
        .order("updated_at", desc=True)
        .execute()
    )
    return result.data


@router.get("/sessions/{session_id}")
async def get_session(session_id: str, user: dict = Depends(get_optional_user)):
    """Returns full session data including chat history."""
    result = (
        supabase.table("sessions")
        .select("*, reports(id, status, fiscal_year, file_hash_sha256, qdrant_collection_id, companies(name_en, name_ar, sector, logo_url))")
        .eq("id", session_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    session = result.data
    # Only the owner can access saved sessions
    if session.get("is_saved") and session.get("user_id") != (user or {}).get("id"):
        raise HTTPException(status_code=403, detail="Access denied")

    return session


@router.patch("/sessions/{session_id}/title")
async def update_session_title(
    session_id: str,
    body: UpdateTitleRequest,
    user: dict = Depends(get_current_user),
):
    """Renames a session."""
    result = (
        supabase.table("sessions")
        .update({"title": body.title})
        .eq("id", session_id)
        .eq("user_id", user["id"])
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")
    return result.data[0]


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, user: dict = Depends(get_current_user)):
    """Deletes a session."""
    supabase.table("sessions").delete().eq("id", session_id).eq("user_id", user["id"]).execute()
    return {"ok": True}
