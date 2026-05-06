"""
Adapter between the backend routes and the AI pipeline.
Routes never import from src/ directly — they go through here.
"""
import sys
import os
from typing import Callable

# Add this directory to sys.path so the pipeline's "from src.x" imports resolve
_here = os.path.dirname(os.path.abspath(__file__))
if _here not in sys.path:
    sys.path.insert(0, _here)

# Store BM25 pickles in a fixed location regardless of where uvicorn runs from
_bm25_dir = os.path.join(_here, "bm25_store")
os.makedirs(_bm25_dir, exist_ok=True)
os.environ.setdefault("BM25_STORAGE_PATH", _bm25_dir)

from src.pipeline.rag_pipeline import AnnualReportRAGPipeline  # noqa: E402
from src.ingestion.cache_manager import get_file_hash  # noqa: E402

# Pipeline is initialized once when the module is first imported.
# CrossEncoder and embeddings load once and are reused for every request.
_pipeline: AnnualReportRAGPipeline | None = None


def _get_pipeline() -> AnnualReportRAGPipeline:
    global _pipeline
    if _pipeline is None:
        _pipeline = AnnualReportRAGPipeline()
    return _pipeline


def process_report(
    file_path: str,
    progress_callback: Callable[[str, int], None] | None = None,
) -> None:
    """
    Ingests a PDF into Qdrant and BM25.
    Meant to be called as a FastAPI BackgroundTask — never awaited inline.
    progress_callback(phase, percent) is called at each pipeline phase.
    """
    _get_pipeline().process_pdf(file_path, progress_callback=progress_callback)


def answer_question(question: str, doc_hash: str) -> dict:
    """
    Runs the RAG pipeline for one question scoped to one report.
    Returns { answer: str, sources: [{ page_number, section_title, snippet }] }
    """
    return _get_pipeline().ask(question, doc_hash=doc_hash)


def compute_file_hash(file_path: str) -> str:
    """SHA256 hash of a file — matches the file_hash_sha256 column in Supabase."""
    return get_file_hash(file_path)
