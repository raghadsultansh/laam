from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.dependencies import get_current_user, get_optional_user
from app.db.supabase import supabase
import app.ai_pipeline.adapter as pipeline

router = APIRouter()


class ChatRequest(BaseModel):
    question: str


@router.get("/sessions/{session_id}/messages")
async def get_messages(session_id: str, user: dict = Depends(get_optional_user)):
    """Returns the chat history for a session."""
    result = (
        supabase.table("sessions")
        .select("chat_history, user_id, is_saved")
        .eq("id", session_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    session = result.data
    if session.get("is_saved") and session.get("user_id") != (user or {}).get("id"):
        raise HTTPException(status_code=403, detail="Access denied")

    return session.get("chat_history", [])


@router.post("/sessions/{session_id}/chat")
async def chat(
    session_id: str,
    body: ChatRequest,
    user: dict = Depends(get_optional_user),
):
    """
    Sends a question to the pipeline and saves the Q&A to the session's chat_history.
    Returns the answer and sources immediately — no streaming yet.
    """
    # Load session + report
    session_result = (
        supabase.table("sessions")
        .select("id, user_id, is_saved, chat_history, reports(id, status, file_hash_sha256, qdrant_collection_id)")
        .eq("id", session_id)
        .single()
        .execute()
    )
    if not session_result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    session = session_result.data
    if session.get("is_saved") and session.get("user_id") != (user or {}).get("id"):
        raise HTTPException(status_code=403, detail="Access denied")

    report = session.get("reports")
    if not report or report["status"] != "ready":
        raise HTTPException(status_code=400, detail="Report is not ready for questions")

    doc_hash = report.get("qdrant_collection_id") or report.get("file_hash_sha256")
    if not doc_hash:
        raise HTTPException(status_code=400, detail="Report has not been indexed yet")

    # Run the pipeline
    result = pipeline.answer_question(body.question, doc_hash=doc_hash)
    answer = result["answer"]
    sources = result["sources"]

    # Append both messages to chat_history
    now = datetime.now(timezone.utc).isoformat()
    history = session.get("chat_history") or []
    history.append({"role": "user", "content": body.question, "created_at": now})
    history.append({"role": "assistant", "content": answer, "sources": sources, "created_at": now})

    supabase.table("sessions").update({
        "chat_history": history,
        "last_message_at": now,
        "updated_at": now,
    }).eq("id", session_id).execute()

    return {"answer": answer, "sources": sources}
