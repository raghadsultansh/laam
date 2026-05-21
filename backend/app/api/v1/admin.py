"""
Admin endpoints — restricted to authenticated admin users.

/api/v1/admin/companies  — list and update company records
/api/v1/admin/reports    — list, update, and delete report records
/api/v1/admin/users      — list registered users
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.core.dependencies import get_current_user
from app.db.supabase import supabase

router = APIRouter()

ADMIN_EMAILS = {"laam.ai.team@gmail.com"}


def _require_admin(user: dict = Depends(get_current_user)) -> dict:
    """Raises 403 if the authenticated user is not an admin."""
    if user.get("email") not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ---------------------------------------------------------------------------
# Companies
# ---------------------------------------------------------------------------

class CompanyUpdate(BaseModel):
    name_en: Optional[str] = None
    name_ar: Optional[str] = None
    sector:  Optional[str] = None
    logo_url: Optional[str] = None
    status:  Optional[str] = None


@router.get("/admin/companies")
async def list_companies(admin: dict = Depends(_require_admin)):
    """Returns all companies regardless of status."""
    result = (
        supabase.table("companies")
        .select("id, name_en, name_ar, sector, ticker, logo_url, status, created_at")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.patch("/admin/companies/{company_id}")
async def update_company(
    company_id: str,
    body: CompanyUpdate,
    admin: dict = Depends(_require_admin),
):
    """Updates company fields — used to approve/reject companies and fix metadata."""
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = (
        supabase.table("companies")
        .update(update)
        .eq("id", company_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Company not found")
    return result.data[0]


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------

class ReportUpdate(BaseModel):
    visibility: Optional[str] = None
    status:     Optional[str] = None
    title:      Optional[str] = None


@router.get("/admin/reports")
async def list_reports(admin: dict = Depends(_require_admin)):
    """Returns all reports with company info and processing status."""
    result = (
        supabase.table("reports")
        .select("id, title, file_name, fiscal_year, status, visibility, created_at, companies(name_en)")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.patch("/admin/reports/{report_id}")
async def update_report(
    report_id: str,
    body: ReportUpdate,
    admin: dict = Depends(_require_admin),
):
    """Updates report visibility or status — e.g., publish a hidden report."""
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = (
        supabase.table("reports")
        .update(update)
        .eq("id", report_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Report not found")
    return result.data[0]


@router.delete("/admin/reports/{report_id}")
async def delete_report(
    report_id: str,
    admin: dict = Depends(_require_admin),
):
    """Permanently deletes a report record (does not delete from Qdrant or storage)."""
    result = (
        supabase.table("reports")
        .delete()
        .eq("id", report_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"deleted": True, "id": report_id}


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

@router.get("/admin/users")
async def list_users(admin: dict = Depends(_require_admin)):
    """Returns all registered users from the Supabase auth.users table via service role."""
    result = supabase.auth.admin.list_users()
    users = [
        {
            "id": u.id,
            "email": u.email,
            "created_at": str(u.created_at),
            "last_sign_in_at": str(u.last_sign_in_at) if u.last_sign_in_at else None,
        }
        for u in (result or [])
    ]
    return users
