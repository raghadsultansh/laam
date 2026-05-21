"""
Dashboard endpoints — KPI data for a report's financial dashboard.

GET  /api/v1/reports/{report_id}/dashboard         → fetch cached KPI data
POST /api/v1/reports/{report_id}/dashboard/generate → extract & cache KPI data
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from app.core.dependencies import get_optional_user
from app.db.supabase import supabase
import app.ai_pipeline.kpi_extractor as kpi_extractor

router = APIRouter()


def _get_report_hash(report_id: str) -> str:
    """Fetch the qdrant_collection_id (= file hash) for a report."""
    result = (
        supabase.table("reports")
        .select("qdrant_collection_id, status")
        .eq("id", report_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Report not found")
    if result.data["status"] != "ready":
        raise HTTPException(status_code=400, detail="Report is not ready yet")
    doc_hash = result.data.get("qdrant_collection_id")
    if not doc_hash:
        raise HTTPException(status_code=400, detail="Report has not been indexed yet")
    return doc_hash


@router.get("/reports/{report_id}/dashboard")
async def get_dashboard(
    report_id: str,
    user: dict = Depends(get_optional_user),
):
    """
    Returns cached KPI dashboard data for a report.
    Returns 404 if no dashboard has been generated yet — frontend shows the Generate button.
    """
    result = (
        supabase.table("report_dashboards")
        .select("data, generated_at")
        .eq("report_id", report_id)
        .order("generated_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="No dashboard generated yet")
    return result.data[0]


@router.post("/reports/{report_id}/dashboard/generate")
async def generate_dashboard(
    report_id: str,
    user: dict = Depends(get_optional_user),
):
    """
    Triggers KPI extraction for a report and caches the result.
    Re-generates if called again (overwrites previous cache).
    """
    doc_hash = _get_report_hash(report_id)

    try:
        dashboard_data = kpi_extractor.extract_kpis(doc_hash)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"KPI extraction failed: {str(e)}")

    now = datetime.now(timezone.utc).isoformat()

    # Upsert into report_dashboards table
    supabase.table("report_dashboards").upsert({
        "report_id": report_id,
        "data": dashboard_data,
        "generated_at": now,
    }, on_conflict="report_id").execute()

    return {"data": dashboard_data, "generated_at": now}
