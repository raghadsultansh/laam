"""
Standalone Docling extraction script.
Runs Docling directly on a PDF and saves the JSON output without pipeline caching.
"""
import json
import time
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.datamodel.base_models import InputFormat

def extract_docling_json(pdf_path: str, output_path: str = "docling_extraction.json"):
    """
    Extracts document using Docling and saves to JSON.
    """
    print(f"[*] Starting Docling extraction on: {pdf_path}")
    start_time = time.time()
    
    pipeline_options = PdfPipelineOptions()
    pipeline_options.do_ocr = False
    pipeline_options.do_table_structure = True
    
    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
        }
    )
    
    print("[*] Converting PDF...")
    conversion_start = time.time()
    result = converter.convert(pdf_path)
    conversion_time = time.time() - conversion_start
    
    print(f"[+] Conversion complete in {conversion_time:.2f}s! Saving to {output_path}...")
    save_start = time.time()
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result.document.model_dump(), f, indent=2)
    save_time = time.time() - save_start
    
    total_time = time.time() - start_time
    print(f"[+] Done! Docling extraction saved to {output_path}")
    print(f"\n[TIMING]")
    print(f"  PDF Conversion: {conversion_time:.2f}s")
    print(f"  JSON Save: {save_time:.2f}s")
    print(f"  Total Time: {total_time:.2f}s")

if __name__ == "__main__":
    import sys
    pdf = sys.argv[1] if len(sys.argv) > 1 else "data/test.pdf"
    output = sys.argv[2] if len(sys.argv) > 2 else "docling_extraction.json"
    extract_docling_json(pdf, output)
