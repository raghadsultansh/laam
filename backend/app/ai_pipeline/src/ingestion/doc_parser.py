"""
Module for parsing PDF annual reports using Docling.
Preserves document structure, tables, and multi-column layouts.
"""
import concurrent.futures
from pathlib import Path
import pypdfium2 as pdfium

from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.datamodel.base_models import InputFormat
from docling_core.types.doc.document import DoclingDocument

def _parse_batch(file_path: str, start_page: int, end_page: int) -> str:
    """
    Isolated worker function to parse a specific page range of a PDF.
    Returns the parsed document as a serialized JSON string to allow
    safe cross-process transfer without pickling errors.
    """
    # Explicitly disable OCR and ensure table structure is kept
    pipeline_options = PdfPipelineOptions()
    pipeline_options.do_ocr = False
    pipeline_options.do_table_structure = True
    
    # Recreate a fresh DocumentConverter per batch to avoid memory build-up (std::bad_alloc)
    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
        }
    )
    
    result = converter.convert(file_path, page_range=(start_page, end_page))
    return result.document.model_dump_json()


class AnnualReportParser:
    def __init__(self, batch_size: int = 10, use_parallel: bool = False, max_workers: int = 2):
        self.batch_size = batch_size
        self.use_parallel = use_parallel
        self.max_workers = max_workers

    def parse_pdf(self, file_path: str | Path) -> DoclingDocument:
        """
        Parses a PDF in batched splits and returns a cleanly structured Docling document object.
        """
        file_path_str = str(file_path)
        print(f"[*] Analyzing document: {file_path_str}")
        
        # Calculate max pages to build accurate batches
        pdf = pdfium.PdfDocument(file_path_str)
        total_pages = len(pdf)
        pdf.close()
        
        print(f"[*] Found {total_pages} pages. Processing in batches of {self.batch_size}...")
        
        batches = []
        for start_page in range(1, total_pages + 1, self.batch_size):
            end_page = min(start_page + self.batch_size - 1, total_pages)
            batches.append((start_page, end_page))
            
        # Allocate array to preserve deterministic ordering natively
        parsed_docs: list[DoclingDocument] = [None] * len(batches)
        
        if self.use_parallel:
            print(f"[*] Parsing {len(batches)} batches using Parallel mode (workers: {self.max_workers})")
            with concurrent.futures.ProcessPoolExecutor(max_workers=self.max_workers) as executor:
                futures = {
                    executor.submit(_parse_batch, file_path_str, start, end): i
                    for i, (start, end) in enumerate(batches)
                }
                
                # As each future completes, assign it to its deterministic index
                for future in concurrent.futures.as_completed(futures):
                    idx = futures[future]
                    try:
                        json_str = future.result()
                        doc = DoclingDocument.model_validate_json(json_str)
                        parsed_docs[idx] = doc
                        print(f"    [+] Completed batch {idx + 1}/{len(batches)}")
                    except Exception as e:
                        print(f"    [!] Error in batch {idx + 1}: {e}")
                        raise
        else:
            print(f"[*] Parsing {len(batches)} batches using default Sequential mode")
            for i, (start, end) in enumerate(batches):
                print(f"    [-] Processing pages {start}-{end} (Batch {i + 1}/{len(batches)})...")
                json_str = _parse_batch(file_path_str, start, end)
                doc = DoclingDocument.model_validate_json(json_str)
                parsed_docs[i] = doc
                print(f"    [+] Completed batch {i + 1}/{len(batches)}")
                
        print("[*] Merging all batches into a single document object...")
        # Use the official DoclingDocument.concatenate API to stitch things together
        final_doc = DoclingDocument.concatenate(parsed_docs)
        print("[+] Merged successfully! Metadata and ordering preserved.")
        
        # Export to JSON for inspection
        import json
        output_path = "extracted_docling.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(final_doc.model_dump(), f, indent=2)
        print(f"[+] Docling extraction saved to {output_path}")
        
        return final_doc
