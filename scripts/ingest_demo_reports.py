"""
Ingest demo PDF reports into Qdrant and Supabase.

Usage:
    python scripts/ingest_demo_reports.py

Put all demo PDFs in the demo_reports/ folder at the project root before running.
Safe to re-run — already-processed reports (status = ready) are skipped.
"""

import csv
import hashlib
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# ── Path setup ────────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
DEMO_DIR = PROJECT_ROOT / "demo_reports"

# Load .env from backend/
from dotenv import load_dotenv
load_dotenv(BACKEND_DIR / ".env")

# Add backend/ to path so pipeline imports resolve
sys.path.insert(0, str(BACKEND_DIR))

# ── Imports ───────────────────────────────────────────────────────────────────
from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Pipeline import is deferred to after path setup
import app.ai_pipeline.adapter as pipeline


# ── Helpers ───────────────────────────────────────────────────────────────────

def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def fetch_companies() -> list[dict]:
    result = supabase.table("companies").select("id, name_en, name_ar, ticker").eq("status", "approved").execute()
    return result.data or []


def match_company(filename: str, companies: list[dict]) -> dict | None:
    """Try to match a PDF filename to a company by name or ticker (case-insensitive)."""
    stem = filename.lower().replace("_", " ").replace("-", " ")
    for company in companies:
        name_en = (company.get("name_en") or "").lower()
        name_ar = (company.get("name_ar") or "")
        ticker = (company.get("ticker") or "").lower()
        # Check if any significant word from the company name appears in the filename
        for word in name_en.split():
            if len(word) > 2 and word in stem:
                return company
        if ticker and ticker in stem:
            return company
    return None


def prompt_company(filename: str, companies: list[dict]) -> dict | None:
    """Interactive fallback — let the user pick the company for an unmatched file."""
    print(f"\n  Could not auto-match '{filename}' to a company.")
    print("  Available companies:")
    for i, c in enumerate(companies):
        print(f"    [{i}] {c['name_en']}")
    print(f"    [s] Skip this file")
    choice = input("  Enter number or 's': ").strip().lower()
    if choice == "s":
        return None
    try:
        return companies[int(choice)]
    except (ValueError, IndexError):
        print("  Invalid choice — skipping.")
        return None


def check_already_processed(doc_hash: str) -> bool:
    result = (
        supabase.table("reports")
        .select("id, status")
        .eq("file_hash_sha256", doc_hash)
        .eq("status", "ready")
        .execute()
    )
    return bool(result.data)


def get_existing_report_id(doc_hash: str) -> str | None:
    """Return the existing row ID for this hash if one exists (any status)."""
    result = (
        supabase.table("reports")
        .select("id")
        .eq("file_hash_sha256", doc_hash)
        .execute()
    )
    return result.data[0]["id"] if result.data else None


def insert_report_row(company_id: str, filename: str, doc_hash: str, fiscal_year: str | None) -> str:
    existing_id = get_existing_report_id(doc_hash)
    if existing_id:
        supabase.table("reports").update({
            "status": "processing",
            "updated_at": now_iso(),
        }).eq("id", existing_id).execute()
        return existing_id
    result = supabase.table("reports").insert({
        "company_id": company_id,
        "file_name": filename,
        "file_hash_sha256": doc_hash,
        "status": "processing",
        "visibility": "public",
        "fiscal_year": fiscal_year,
        "title": filename.replace(".pdf", "").replace("_", " "),
    }).execute()
    return result.data[0]["id"]


def mark_ready(report_id: str, doc_hash: str):
    supabase.table("reports").update({
        "status": "ready",
        "qdrant_collection_id": doc_hash,
        "processed_at": now_iso(),
        "updated_at": now_iso(),
    }).eq("id", report_id).execute()


def mark_failed(report_id: str, error: str):
    supabase.table("reports").update({
        "status": "failed",
        "updated_at": now_iso(),
    }).eq("id", report_id).execute()


def extract_fiscal_year(filename: str) -> str | None:
    """Pull a 4-digit year from the filename if present."""
    import re
    match = re.search(r"(20\d{2})", filename)
    return match.group(1) if match else None


def count_pages(path: Path) -> int | None:
    try:
        from pypdf import PdfReader
        return len(PdfReader(str(path)).pages)
    except Exception:
        return None


LOG_FILE = DEMO_DIR / "ingest_log.csv"
_LOG_FIELDS = ["timestamp", "filename", "pages", "duration_seconds", "status", "report_id", "error"]


def _write_log(row: dict):
    write_header = not LOG_FILE.exists()
    with open(LOG_FILE, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=_LOG_FIELDS)
        if write_header:
            writer.writeheader()
        writer.writerow(row)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    pdfs = sorted(DEMO_DIR.glob("*.pdf"))
    if not pdfs:
        print(f"No PDF files found in {DEMO_DIR}")
        print("Put your demo PDFs there and re-run.")
        return

    print(f"Found {len(pdfs)} PDF(s) in demo_reports/\n")

    companies = fetch_companies()
    if not companies:
        print("ERROR: No approved companies found in Supabase.")
        print("Seed your companies table first.")
        sys.exit(1)

    processed = skipped = failed = 0

    for pdf in pdfs:
        print(f"── {pdf.name}")

        # 1. Hash
        print("   Computing SHA256...", end=" ", flush=True)
        doc_hash = sha256(pdf)
        print(doc_hash[:16] + "...")

        # 2. Skip if already done
        if check_already_processed(doc_hash):
            print("   ✓ Already processed — skipping.\n")
            skipped += 1
            continue

        # 3. Match company
        company = match_company(pdf.name, companies)
        if company is None:
            company = prompt_company(pdf.name, companies)
        if company is None:
            print("   Skipped.\n")
            skipped += 1
            continue

        print(f"   Company: {company['name_en']}")

        # 4. Page count
        pages = count_pages(pdf)
        print(f"   Pages: {pages if pages is not None else 'unknown'}")

        # 5. Insert report row
        fiscal_year = extract_fiscal_year(pdf.name)
        report_id = insert_report_row(company["id"], pdf.name, doc_hash, fiscal_year)
        print(f"   Supabase row created: {report_id}")

        # 6. Run pipeline
        def progress(phase: str, percent: int):
            print(f"   [{percent:>3}%] {phase}", flush=True)

        t0 = time.monotonic()
        try:
            print(f"   Running pipeline on {pdf.name}...")
            pipeline.process_report(str(pdf), progress_callback=progress)
            duration = round(time.monotonic() - t0, 1)
            mark_ready(report_id, doc_hash)
            print(f"   ✓ Done in {duration}s — report is ready in Qdrant and Supabase.\n")
            _write_log({"timestamp": now_iso(), "filename": pdf.name, "pages": pages,
                        "duration_seconds": duration, "status": "ready", "report_id": report_id, "error": ""})
            processed += 1
        except Exception as e:
            duration = round(time.monotonic() - t0, 1)
            mark_failed(report_id, str(e))
            print(f"   ✗ FAILED after {duration}s: {e}\n")
            _write_log({"timestamp": now_iso(), "filename": pdf.name, "pages": pages,
                        "duration_seconds": duration, "status": "failed", "report_id": report_id, "error": str(e)})
            failed += 1

    print("═" * 50)
    print(f"Summary: {processed} processed, {skipped} skipped, {failed} failed")


if __name__ == "__main__":
    main()
