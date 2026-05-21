"""
KPI Extractor — pulls structured financial KPIs from an annual report.

Uses the existing RAG pipeline's LLM to answer targeted financial questions
and returns a DashboardData-shaped dict ready to store in Supabase.
"""
from __future__ import annotations
import json
import re
import sys
import os

_here = os.path.dirname(os.path.abspath(__file__))
if _here not in sys.path:
    sys.path.insert(0, _here)

from src.generation.llm import AnswerGenerator  # noqa: E402

# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------

_SYSTEM = """You are a financial data extraction assistant.
Extract the requested KPIs from the annual report context provided.
Return ONLY valid JSON — no markdown, no explanation, no code fences."""

_PROMPT = """Extract the following financial KPIs from this annual report.
Return a single JSON object with this exact structure:

{
  "income_statement": {
    "current_year":  { "revenue": <num|null>, "gross_profit": <num|null>, "operating_income": <num|null>, "net_income": <num|null>, "ebitda": <num|null>, "eps": <num|null> },
    "prior_year":    { "revenue": <num|null>, "gross_profit": <num|null>, "operating_income": <num|null>, "net_income": <num|null>, "ebitda": <num|null>, "eps": <num|null> }
  },
  "balance_sheet": {
    "current_year": { "total_assets": <num|null>, "total_liabilities": <num|null>, "total_equity": <num|null>, "cash_and_equivalents": <num|null>, "current_assets": <num|null>, "current_liabilities": <num|null> },
    "prior_year":   { "total_assets": <num|null>, "total_liabilities": <num|null>, "total_equity": <num|null>, "cash_and_equivalents": <num|null>, "current_assets": <num|null>, "current_liabilities": <num|null> }
  },
  "cash_flow": {
    "current_year": { "operating_cf": <num|null>, "investing_cf": <num|null>, "financing_cf": <num|null>, "free_cash_flow": <num|null> },
    "prior_year":   { "operating_cf": <num|null>, "investing_cf": <num|null>, "financing_cf": <num|null>, "free_cash_flow": <num|null> }
  },
  "supplemental": {
    "fiscal_year":  <string|null>,
    "currency":     <string|null>,
    "unit_label":   <string|null>,
    "unit_divisor": <number>
  }
}

Rules:
- All monetary values must be in the SAME unit (thousands, millions, or billions).
- Set unit_label to "thousands", "millions", or "billions" accordingly.
- Set unit_divisor to 1000, 1000000, or 1000000000 to match.
- Use null for any value not found in the document.
- Do not invent numbers. Only extract what is explicitly stated.

Report context:
{context}
"""

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _wrap(value: float | None, confidence: float = 0.9) -> dict:
    """Wrap a raw number into the DashExtractedValue shape the frontend expects."""
    if value is None:
        return {"value": None, "confidence": None, "note": None}
    return {"value": value, "confidence": confidence, "note": None}


def _wrap_year(year_dict: dict | None, confidence: float = 0.9) -> dict | None:
    if not year_dict:
        return None
    return {k: _wrap(v, confidence) for k, v in year_dict.items()}


def _parse_llm_json(raw: str) -> dict:
    """Strip markdown fences and parse JSON."""
    cleaned = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()
    return json.loads(cleaned)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def extract_kpis(doc_hash: str) -> dict:
    """
    Runs KPI extraction against the report identified by doc_hash.
    Returns a DashboardData-shaped dict.

    Raises on LLM or parsing failure — caller should catch and handle.
    """
    generator = AnswerGenerator()

    # Build a focused extraction prompt
    prompt = _PROMPT.replace("{context}", "[retrieved from vector store]")

    # Re-use the pipeline's ask() method with a structured extraction question
    from src.pipeline.rag_pipeline import AnnualReportRAGPipeline
    pipeline = AnnualReportRAGPipeline()
    raw_result = pipeline.ask(
        question=(
            "Extract all financial KPIs from this report including: "
            "revenue, gross profit, operating income, net income, EBITDA, EPS, "
            "total assets, total liabilities, total equity, cash and equivalents, "
            "current assets, current liabilities, operating cash flow, investing cash flow, "
            "financing cash flow, free cash flow. Include both current and prior year. "
            "Return as structured JSON only."
        ),
        doc_hash=doc_hash,
        system_override=_SYSTEM,
        raw_json_mode=True,
    )

    raw_answer = raw_result.get("answer", "") if isinstance(raw_result, dict) else str(raw_result)
    extracted = _parse_llm_json(raw_answer)

    # Shape into DashboardData with confidence wrappers
    income = extracted.get("income_statement", {})
    balance = extracted.get("balance_sheet", {})
    cashflow = extracted.get("cash_flow", {})
    supplemental = extracted.get("supplemental", {})

    return {
        "income_statement": {
            "current_year": _wrap_year(income.get("current_year")),
            "prior_year":   _wrap_year(income.get("prior_year")),
        },
        "balance_sheet": {
            "current_year": _wrap_year(balance.get("current_year")),
            "prior_year":   _wrap_year(balance.get("prior_year")),
        },
        "cash_flow": {
            "current_year": _wrap_year(cashflow.get("current_year")),
            "prior_year":   _wrap_year(cashflow.get("prior_year")),
        },
        "supplemental": {
            "fiscal_year":  supplemental.get("fiscal_year"),
            "currency":     supplemental.get("currency"),
            "unit_label":   supplemental.get("unit_label"),
            "unit_divisor": supplemental.get("unit_divisor", 1),
        },
    }
