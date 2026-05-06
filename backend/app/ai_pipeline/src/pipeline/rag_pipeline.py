"""
Main orchestration module tying together ingestion, storage, retrieval, judging, and generation.
"""
from pathlib import Path
from dotenv import load_dotenv
from typing import Callable

from langchain_openai import OpenAIEmbeddings
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.prompts import PromptTemplate

from src.ingestion.doc_parser import AnnualReportParser
from src.processing.chunker import StructureAwareChunker
from src.retrieval.vector_store import RetrieverManager
from src.generation.llm import AnswerGenerator
from src.generation.judge import EvidenceJudge
from src.ingestion.cache_manager import get_file_hash

load_dotenv()

class AnnualReportRAGPipeline:
    def __init__(self, custom_llm: BaseChatModel = None, closed_model_name: str = "gpt-4o"):
        self.parser = AnnualReportParser()
        self.chunker = StructureAwareChunker()
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
        
        self.retriever_manager = RetrieverManager(self.embeddings)  # no collection at init — per-report
        self.generator = AnswerGenerator(llm_override=custom_llm, model_name=closed_model_name)
        self.judge = EvidenceJudge(model_name=closed_model_name)
        
        # Simple query expansion chain using the base LLM instance
        self.expansion_chain = PromptTemplate.from_template(
            "Rewrite this financial question to include critical synonyms or metric aliases to massively improve vector search recall. "
            "For example, expand 'revenue' to 'revenue, sales, top-line'. "
            "Original Query: {query}\n"
            "Output ONLY the comma-separated keywords and the original query phrase combined. No conversational text."
        ) | self.generator.llm

    def process_pdf(
        self,
        file_path: str,
        force_reprocess: bool = False,
        progress_callback: Callable[[str, int], None] | None = None,
    ):
        """
        Ingests a PDF into Qdrant and BM25.

        progress_callback(phase, percent) is called before each phase so the
        backend can write progress to the processing_jobs table. Phase codes
        match the current_phase CHECK constraint in Supabase:
          parsing (15) → chunking (75) → indexing (85) → completed (100)
        Pass None to run without progress tracking (e.g. standalone testing).
        """
        def _progress(phase: str, percent: int):
            print(f"[*] Phase: {phase} ({percent}%)")
            if progress_callback:
                progress_callback(phase, percent)

        doc_hash = get_file_hash(file_path)
        collection_name = doc_hash

        if force_reprocess:
            self.retriever_manager.delete_document(doc_hash, collection_name=collection_name)

        if self.retriever_manager.has_document(doc_hash, collection_name=collection_name):
            print(f"[*] Hash {doc_hash} already fully indexed. Skipping slow docling ingestion! (Cache Hit)")
            return

        print(f"[*] Starting ingestion for: {file_path}")

        _progress("parsing", 15)
        parsed_doc = self.parser.parse_pdf(file_path)

        _progress("chunking", 75)
        documents = self.chunker.create_langchain_documents(parsed_doc, file_path, doc_hash)

        _progress("indexing", 85)
        self.retriever_manager.index_documents(documents, collection_name=collection_name)

        _progress("completed", 100)
        print("[+] Ingestion successful!")

    def ask(self, query: str, doc_hash: str, top_k: int = 10, debug: bool = False) -> dict:
        """
        Returns a dict with two keys:
          answer  — the generated answer string
          sources — list of { page_number, section_title, snippet } from filtered chunks
        """

        # 1. Query Expansion
        expanded_query = self.expansion_chain.invoke({"query": query}).content.strip()
        if debug:
            print(f"\n[DEBUG] Expanded Query: {expanded_query}")

        # 2. Hybrid Retrieval + Reranking — scoped to this report's collection only
        retriever = self.retriever_manager.get_retriever(collection_name=doc_hash, top_k=top_k)
        retrieved_docs = retriever.invoke(expanded_query)

        if debug:
            print(f"\n[DEBUG] Retrieved {len(retrieved_docs)} candidates from Qdrant/BM25.")

        # 3. LLM Evidence Judge
        decision = self.judge.judge_evidence(query, retrieved_docs)

        if debug:
            print(f"\n[DEBUG] LLM Judge Decision:\n"
                  f"- Answerability: {decision.is_sufficient}\n"
                  f"- Query Type: {decision.query_type}\n"
                  f"- Needs Calc: {decision.requires_calculation}\n"
                  f"- Best Chunks: {decision.relevant_chunk_ids}\n"
                  f"- Rationale: {decision.confidence_rationale}\n")

        # Safely filter documents based on the index list the judge approved
        filtered_docs = []
        for idx in decision.relevant_chunk_ids:
            if 0 <= idx < len(retrieved_docs):
                filtered_docs.append(retrieved_docs[idx])

        # Fallback if judge returns nothing but says it's sufficient
        if not filtered_docs and decision.is_sufficient:
            filtered_docs = retrieved_docs[:3]

        if not decision.is_sufficient and decision.query_type in ["irrelevant", "factual", "descriptive"]:
            # Hard refusal — no generation, no sources
            return {
                "answer": "I do not have enough information to answer this based on the provided document.",
                "sources": [],
            }

        # 4. Final Grounded Generation
        answer = self.generator.generate_answer(query, filtered_docs)

        # 5. Extract sources from the judge-approved chunks
        seen = set()
        sources = []
        for doc in filtered_docs:
            meta = doc.metadata
            page = str(meta.get("page", "")).strip()
            section = str(meta.get("section", "")).strip()
            key = (page, section)
            if key in seen:
                continue
            seen.add(key)
            sources.append({
                "page_number": page,
                "section_title": section,
                "snippet": doc.page_content[:300].strip(),
            })

        return {"answer": answer, "sources": sources}
