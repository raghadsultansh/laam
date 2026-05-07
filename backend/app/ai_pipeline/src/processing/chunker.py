"""
Module for structure-aware chunking.
Converts Docling documents into LangChain Document objects with rich metadata.
"""
from docling.chunking import HierarchicalChunker
from langchain_core.documents import Document

class StructureAwareChunker:
    def __init__(self):
        # Hierarchical chunker keeps headings and tables intact without arbitrary splitting
        self.chunker = HierarchicalChunker()

    def _determine_chunk_type(self, text_content: str) -> str:
        """
        Simple heuristic logic: if it contains standard markdown table borders, label it a table.
        """
        if "|-" in text_content and "|" in text_content:
            return "table"
        return "text"

    def create_langchain_documents(self, parsed_doc, file_path: str, doc_hash: str) -> list[Document]:
        """
        Chunks the parsed document and converts them to LangChain format with advanced caching metadata.
        """
        chunks = list(self.chunker.chunk(parsed_doc))
        
        lc_documents = []
        for chunk in chunks:
            text_content = getattr(chunk, "text", "")
            meta = getattr(chunk, "meta", None)
            
            page_numbers = set()
            if meta and getattr(meta, "doc_items", None):
                for item in meta.doc_items:
                    for prov in (getattr(item, "prov", None) or []):
                        if hasattr(prov, "page_no"):
                            page_numbers.add(prov.page_no)

            page_str = ", ".join(map(str, sorted(list(page_numbers)))) if page_numbers else "Unknown"

            headings = (getattr(meta, "headings", None) or []) if meta else []
            headings_text = []
            for h in headings:
                if isinstance(h, str):
                    headings_text.append(h)
                else:
                    headings_text.append(getattr(h, "text", str(h)))
                    
            chunk_type = self._determine_chunk_type(text_content)
            
            # 6. Preserve metadata robustly
            metadata = {
                "source": getattr(parsed_doc, "name", str(file_path)),
                "filepath": str(file_path),
                "doc_hash": doc_hash,
                "page": page_str,
                "section": " > ".join(headings_text) if headings_text else "Unknown Section",
                "chunk_type": chunk_type
            }
            
            lc_documents.append(Document(page_content=text_content, metadata=metadata))
            
        return lc_documents
