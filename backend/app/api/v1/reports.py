import hashlib
import tempfile
import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from app.core.dependencies import get_current_user
from app.db.supabase import supabase
import app.ai_pipeline.adapter as pipeline

router = APIRouter()


def _compute_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _run_processing(report_id: str, tmp_path: str, job_id: str):
    """Background task — runs the pipeline and writes progress to processing_jobs."""
    def callback(phase: str, percent: int):
        update = {"current_phase": phase, "percent_complete": percent, "updated_at": datetime.now(timezone.utc).isoformat()}
        if phase == "completed":
            update["status"] = "completed"
            update["completed_at"] = datetime.now(timezone.utc).isoformat()
        supabase.table("processing_jobs").update(update).eq("id", job_id).execute()

        if phase == "completed":
            doc_hash = pipeline.compute_file_hash(tmp_path)
            supabase.table("reports").update({
                "status": "ready",
                "qdrant_collection_id": doc_hash,
                "processed_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", report_id).execute()

    try:
        pipeline.process_report(tmp_path, progress_callback=callback)
    except Exception as e:
        supabase.table("processing_jobs").update({
            "status": "failed",
            "current_phase": "failed",
            "error_message": str(e),
            "failure_reason_code": "pipeline_error",
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", job_id).execute()
        supabase.table("reports").update({"status": "failed"}).eq("id", report_id).execute()
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@router.get("/reports")
async def list_reports():
    """
    Returns all public ready reports grouped by company.
    Used for the reports library page — no auth required.
    """
    result = (
        supabase.table("reports")
        .select("id, title, fiscal_year, report_type, status, file_hash_sha256, companies!inner(id, name_en, name_ar, sector, ticker, logo_url, status)")
        .eq("status", "ready")
        .eq("visibility", "public")
        .eq("companies.status", "approved")
        .execute()
    )

    # Group by company
    companies: dict = {}
    for report in result.data:
        company = report.pop("companies")
        cid = company["id"]
        if cid not in companies:
            companies[cid] = {**company, "reports": []}
        companies[cid]["reports"].append(report)

    return list(companies.values())


@router.get("/reports/{report_id}/status")
async def get_report_status(report_id: str):
    """
    Returns current processing phase and percent.
    Frontend polls this every 3 seconds while a report is processing.
    """
    result = (
        supabase.table("processing_jobs")
        .select("status, current_phase, percent_complete, error_message, failure_reason_code")
        .eq("report_id", report_id)
        .order("started_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="No processing job found for this report")
    return result.data[0]


@router.post("/reports/upload")
async def upload_report(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    """
    Accepts a PDF upload from a registered user.
    Deduplicates by SHA256 hash — if the file already exists, returns the existing report.
    Triggers background processing for new files.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    file_bytes = await file.read()
    doc_hash = _compute_sha256(file_bytes)

    # Check if this exact file already exists
    existing = (
        supabase.table("reports")
        .select("id, status, qdrant_collection_id")
        .eq("file_hash_sha256", doc_hash)
        .execute()
    )

    if existing.data:
        report = existing.data[0]
        return {
            "report_id": report["id"],
            "status": report["status"],
            "is_duplicate": True,
        }

    # New file — upload to Supabase Storage
    storage_path = f"{doc_hash}.pdf"
    supabase.storage.from_("report-pdfs").upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": "application/pdf"},
    )

    # Create report row
    report_result = supabase.table("reports").insert({
        "file_hash_sha256": doc_hash,
        "file_name": file.filename,
        "storage_path": storage_path,
        "status": "processing",
        "visibility": "hidden",
        "uploaded_by": user["id"],
    }).execute()
    report_id = report_result.data[0]["id"]

    # Create processing job row
    job_result = supabase.table("processing_jobs").insert({
        "report_id": report_id,
        "created_by": user["id"],
        "status": "running",
        "current_phase": "parsing",
        "percent_complete": 0,
    }).execute()
    job_id = job_result.data[0]["id"]

    # Write PDF to a temp file — the background task will delete it when done
    tmp = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
    tmp.write(file_bytes)
    tmp.close()

    # Dispatch as background task — returns immediately to the frontend
    background_tasks.add_task(_run_processing, report_id, tmp.name, job_id)

    return {
        "report_id": report_id,
        "status": "processing",
        "is_duplicate": False,
    }
