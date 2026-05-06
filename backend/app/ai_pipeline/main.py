import sys
import argparse

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from src.pipeline.rag_pipeline import AnnualReportRAGPipeline

def run_chat():
    parser = argparse.ArgumentParser(description="Terminal-First LLM-Augmented RAG Chatbot")
    parser.add_argument("--pdf", type=str, default="data/test.pdf", help="Path to the PDF to ingest")
    parser.add_argument("--debug", action="store_true", help="Start with debug mode enabled")
    args = parser.parse_args()

    print("\n[*] Initializing Backend: LLM-Augmented RAG Pipeline...")
    try:
        pipeline = AnnualReportRAGPipeline()
    except Exception as e:
        print(f"\n[!] Failed to initialize pipeline: {e}")
        print("Please ensure your OPENAI_API_KEY is correctly set in .env.")
        sys.exit(1)
        
    print(f"\n[*] Loading document target: {args.pdf}")
    pipeline.process_pdf(args.pdf)
    
    print("\n" + "="*60)
    print("Welcome to the Grounded Financial Report Analyst Chatbot!")
    print("Commands:")
    print("  'exit'      -> End session")
    print("  'reprocess' -> Force re-ingestion and vector wipe of the PDF")
    print("  'debug on'  -> Show LLM Judge routing & retrieval metadata")
    print("  'debug off' -> Hide LLM Judge routing")
    print("  'test_eval' -> Run standard QA evaluation battery")
    print("="*60 + "\n")
    
    debug_mode = args.debug
    
    while True:
        try:
            query = input("\n[User]> ")
            if not query.strip(): continue
            
            cmd = query.strip().lower()
            if cmd == "exit":
                print("[System] Goodbye!")
                break
            elif cmd == "reprocess":
                print(f"[System] Forcing re-ingestion mapping for {args.pdf}...")
                pipeline.process_pdf(args.pdf, force_reprocess=True)
                continue
            elif cmd == "debug on":
                debug_mode = True
                print("[System] Debug mode ENABLED.")
                continue
            elif cmd == "debug off":
                debug_mode = False
                print("[System] Debug mode DISABLED.")
                continue
            elif cmd == "test_eval":
                print("\n[System] Running comprehensive Evaluation Test Battery...\n")
                tests = [
                    "What was Aramco's net income in 2024?",
                    "What total dividends were paid in 2024?",
                    "Is there a table comparing 2023 and 2024 metrics?",
                    "What sustainability initiatives are mentioned?",
                    "What future energy transition strategies are described?",
                    "What is the percentage change in net income between 2023 and 2024?",
                    "Does the report mention alien invasions?"
                ]
                for t in tests:
                    print(f"[Q] {t}")
                    answer = pipeline.ask(t, debug=debug_mode)
                    print(f"[A] {answer}\n")
                    print("-"*40)
                continue
                
            print("[*] Processing...")
            answer = pipeline.ask(query, debug=debug_mode)
            print(f"\n[System]> {answer}\n")
            
        except KeyboardInterrupt:
            print("\n[System] Goodbye!")
            break
        except Exception as e:
            print(f"\n[!] Encountered critical reasoning error: {e}")

if __name__ == "__main__":
    run_chat()