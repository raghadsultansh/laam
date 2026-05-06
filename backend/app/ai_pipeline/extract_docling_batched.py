"""
Standalone Docling extraction script with batch processing.
Tests Docling performance in isolation with batched page processing.
No caching, no pipeline integration - just pure Docling extraction.
"""
import json
import time
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
    Returns the parsed document as a serialized JSON string.
    """
    pipeline_options = PdfPipelineOptions()
    pipeline_options.do_ocr = False
    pipeline_options.do_table_structure = True
    
    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
        }
    )
    
    result = converter.convert(file_path, page_range=(start_page, end_page))
    return result.document.model_dump_json()


def extract_docling_batched(
    pdf_path: str,
    output_path: str = "docling_batched_extraction.json",
    batch_size: int = 10,
    use_parallel: bool = False,
    max_workers: int = 2
):
    """
    Extracts document using Docling with batch processing and saves to JSON.
    
    Args:
        pdf_path: Path to PDF file
        output_path: Where to save the JSON output
        batch_size: Pages per batch
        use_parallel: Use parallel processing or sequential
        max_workers: Number of parallel workers
    """
    print(f"[*] Starting Docling batch extraction on: {pdf_path}")
    total_start = time.time()
    
    file_path_str = str(pdf_path)
    
    # Get total page count
    print("[*] Analyzing document...")
    pdf = pdfium.PdfDocument(file_path_str)
    total_pages = len(pdf)
    pdf.close()
    print(f"[*] Found {total_pages} pages. Processing in batches of {batch_size}...")
    
    # Create batches
    batches = []
    for start_page in range(1, total_pages + 1, batch_size):
        end_page = min(start_page + batch_size - 1, total_pages)
        batches.append((start_page, end_page))
    
    # Allocate array to preserve deterministic ordering
    parsed_docs: list[DoclingDocument] = [None] * len(batches)
    
    batch_start = time.time()
    
    if use_parallel:
        print(f"[*] Parsing {len(batches)} batches using Parallel mode (workers: {max_workers})")
        with concurrent.futures.ProcessPoolExecutor(max_workers=max_workers) as executor:
            futures = {
                executor.submit(_parse_batch, file_path_str, start, end): i
                for i, (start, end) in enumerate(batches)
            }
            
            for future in concurrent.futures.as_completed(futures):
                idx = futures[future]
                try:
                    json_str = future.result()
                    doc = DoclingDocument.model_validate_json(json_str)
                    parsed_docs[idx] = doc
                    print(f"    [+] Completed batch {idx + 1}/{len(batches)} (pages {batches[idx][0]}-{batches[idx][1]})")
                except Exception as e:
                    print(f"    [!] Error in batch {idx + 1}: {e}")
                    raise
    else:
        print(f"[*] Parsing {len(batches)} batches using Sequential mode")
        for i, (start, end) in enumerate(batches):
            print(f"    [-] Processing pages {start}-{end} (Batch {i + 1}/{len(batches)})...")
            json_str = _parse_batch(file_path_str, start, end)
            doc = DoclingDocument.model_validate_json(json_str)
            parsed_docs[i] = doc
            print(f"    [+] Completed batch {i + 1}/{len(batches)}")
    
    batch_time = time.time() - batch_start
    
    print("[*] Merging all batches into a single document object...")
    merge_start = time.time()
    final_doc = DoclingDocument.concatenate(parsed_docs)
    merge_time = time.time() - merge_start
    print("[+] Merged successfully! Metadata and ordering preserved.")
    
    # Save to JSON with proper serialization
    print(f"[*] Saving to {output_path}...")
    save_start = time.time()
    with open(output_path, "w", encoding="utf-8") as f:
        # Use mode='json' to handle special types like AnyUrl
        json.dump(final_doc.model_dump(mode='json'), f, indent=2)
    save_time = time.time() - save_start
    
    total_time = time.time() - total_start
    
    print(f"[+] Done! Extracted and saved to {output_path}")
    print(f"\n[TIMING SUMMARY]")
    print(f"  Batch Processing: {batch_time:.2f}s")
    print(f"  Merging: {merge_time:.2f}s")
    print(f"  JSON Save: {save_time:.2f}s")
    print(f"  Total Time: {total_time:.2f}s")
    
    return final_doc


if __name__ == "__main__":
    import sys
    
    pdf = sys.argv[1] if len(sys.argv) > 1 else "data/Al_Rajhi_Bank_AR2024_English.pdf"
    output = sys.argv[2] if len(sys.argv) > 2 else "docling_batched_extraction.json"
    batch_size = int(sys.argv[3]) if len(sys.argv) > 3 else 10
    parallel = sys.argv[4].lower() == "true" if len(sys.argv) > 4 else False
    
    extract_docling_batched(
        pdf_path=pdf,
        output_path=output,
        batch_size=batch_size,
        use_parallel=parallel,
        max_workers=2
    )
