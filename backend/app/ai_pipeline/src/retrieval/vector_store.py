"""
Module for indexing and retrieving chunks using Hybrid Search and Reranking.

Each report gets its own Qdrant collection and BM25 pickle, both named by the
report's SHA256 hash. The QdrantClient and CrossEncoder are initialized once
and shared across all per-report operations.
"""
from langchain_qdrant import QdrantVectorStore
from langchain_community.retrievers import BM25Retriever
from langchain_classic.retrievers import EnsembleRetriever, ContextualCompressionRetriever
from langchain_community.cross_encoders import HuggingFaceCrossEncoder
from langchain_classic.retrievers.document_compressors import CrossEncoderReranker
from langchain_core.embeddings import Embeddings
from langchain_core.documents import Document

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
import os
import pickle

# Use the locally cached CrossEncoder weights — prevents unexpected network calls
# at runtime. The model must be downloaded once before deployment.
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")


class RetrieverManager:
    def __init__(self, embeddings: Embeddings):
        self.embeddings = embeddings

        # Shared Qdrant Cloud client — initialized once, used for all collections
        qdrant_url = os.environ["QDRANT_HOST"]
        qdrant_api_key = os.environ["QDRANT_API_KEY"]
        self.client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)

        # CrossEncoder initialized once — loading HuggingFace weights is expensive
        print("[*] Initializing CrossEncoder Reranker (BAAI/bge-reranker-base)...")
        self.cross_encoder = HuggingFaceCrossEncoder(model_name="BAAI/bge-reranker-base")
        self.reranker = CrossEncoderReranker(model=self.cross_encoder, top_n=5)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _bm25_path(self, collection_name: str) -> str:
        """Returns the BM25 pickle path for a given collection (doc_hash).
        Uses BM25_STORAGE_PATH env var so the backend controls where files land."""
        base = os.environ.get("BM25_STORAGE_PATH", ".")
        return os.path.join(base, f"{collection_name}_bm25.pkl")

    def _ensure_collection(self, collection_name: str):
        """Creates the Qdrant collection if it does not already exist."""
        existing = [c.name for c in self.client.get_collections().collections]
        if collection_name not in existing:
            print(f"[*] Creating new Qdrant collection: {collection_name}")
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=3072, distance=Distance.COSINE),
            )
        else:
            print(f"[*] Re-using existing Qdrant collection: {collection_name}")

    def _load_bm25_docs(self, collection_name: str) -> list[Document]:
        """Loads the BM25 document list for this collection from disk."""
        path = self._bm25_path(collection_name)
        if os.path.exists(path):
            print(f"[*] Loading BM25 documents from {path}")
            with open(path, "rb") as f:
                return pickle.load(f)
        return []

    def _save_bm25_docs(self, collection_name: str, documents: list[Document]):
        """Persists the BM25 document list for this collection to disk."""
        path = self._bm25_path(collection_name)
        with open(path, "wb") as f:
            pickle.dump(documents, f)
        print(f"[*] Saved {len(documents)} BM25 documents to {path}")

    # ------------------------------------------------------------------
    # Public API — all methods take collection_name (the doc_hash)
    # ------------------------------------------------------------------

    def index_documents(self, documents: list[Document], collection_name: str):
        """Indexes documents into both Qdrant (dense) and BM25 (sparse) for this report."""
        self._ensure_collection(collection_name)

        # Dense indexing into this report's Qdrant collection
        vector_store = QdrantVectorStore(
            client=self.client,
            collection_name=collection_name,
            embedding=self.embeddings,
        )
        vector_store.add_documents(documents)
        print(f"[*] Indexed {len(documents)} documents into Qdrant collection: {collection_name}")

        # Sparse indexing — append to this report's BM25 pickle
        existing = self._load_bm25_docs(collection_name)
        existing.extend(documents)
        self._save_bm25_docs(collection_name, existing)

    def has_document(self, doc_hash: str, collection_name: str) -> bool:
        """Returns True if this report's BM25 pickle already exists and contains the hash."""
        docs = self._load_bm25_docs(collection_name)
        return any(d.metadata.get("doc_hash") == doc_hash for d in docs)

    def delete_document(self, doc_hash: str, collection_name: str):
        """Purges a report completely from its Qdrant collection and BM25 pickle."""
        print(f"[*] Purging document hash {doc_hash} from collection {collection_name}...")

        # Remove from BM25 pickle
        docs = self._load_bm25_docs(collection_name)
        filtered = [d for d in docs if d.metadata.get("doc_hash") != doc_hash]
        if len(filtered) != len(docs):
            self._save_bm25_docs(collection_name, filtered)

        # Remove from Qdrant
        from qdrant_client.models import Filter, FieldCondition, MatchValue
        try:
            self.client.delete(
                collection_name=collection_name,
                points_selector=Filter(
                    must=[
                        FieldCondition(
                            key="metadata.doc_hash",
                            match=MatchValue(value=doc_hash),
                        )
                    ]
                ),
            )
        except Exception:
            pass  # collection may not exist yet on a first-attempt failure
        print("[+] Purge complete.")

    def get_retriever(self, collection_name: str, top_k: int = 10):
        """
        Returns a Hybrid Retriever (BM25 + Dense Qdrant) wrapped in a CrossEncoder
        Reranker, scoped entirely to the given report collection.
        """
        search_k = top_k * 3  # Over-fetch for reranker

        documents = self._load_bm25_docs(collection_name)

        vector_store = QdrantVectorStore(
            client=self.client,
            collection_name=collection_name,
            embedding=self.embeddings,
        )

        # Sparse BM25 search
        bm25_retriever = BM25Retriever.from_documents(documents)
        bm25_retriever.k = search_k

        # Dense Qdrant search
        dense_retriever = vector_store.as_retriever(search_kwargs={"k": search_k})

        # Ensemble: 40% keyword, 60% semantic
        ensemble_retriever = EnsembleRetriever(
            retrievers=[bm25_retriever, dense_retriever],
            weights=[0.4, 0.6],
        )

        # Wrap with CrossEncoder to surface the absolute best chunks
        self.reranker.top_n = top_k
        return ContextualCompressionRetriever(
            base_compressor=self.reranker,
            base_retriever=ensemble_retriever,
        )
