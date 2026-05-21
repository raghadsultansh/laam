import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(override=True)

BASE_DIR = Path(__file__).parent

# Directories
INPUT_DIR              = BASE_DIR / "input"
BATCH_INPUTS_DIR       = BASE_DIR / "batch_inputs"
BATCH_OUTPUTS_DIR      = BASE_DIR / "batch_outputs"
VALIDATION_REPORTS_DIR = BASE_DIR / "validation_reports"
FAILED_ROWS_DIR        = BASE_DIR / "failed_rows"
FINAL_DIR              = BASE_DIR / "final"

ALL_DIRS = [
    INPUT_DIR, BATCH_INPUTS_DIR, BATCH_OUTPUTS_DIR,
    VALIDATION_REPORTS_DIR, FAILED_ROWS_DIR, FINAL_DIR,
]

# Source files
SOURCE_JSON = BASE_DIR / "tatqa_dataset_train.json"
SOURCE_CSV  = INPUT_DIR / "tatqa_source.csv"

# API - Generator
GEMINI_API_KEY  = os.getenv("GEMINI_API_KEY")
GENERATOR_MODEL = "gemini-2.5-flash"

# API - Judge
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
JUDGE_MODEL       = "claude-sonnet-4-5"

# Stop token - change this one line before training on a different model family:
#   Qwen:     <|im_end|>
#   Llama:    <|eot_id|>
#   DeepSeek: <|end of sentence|>
STOP_TOKEN = "<|im_end|>"

# Fixed counts for 50-row smoke run; None = proportional for larger batches
SAMPLE_DISTRIBUTION = {
    50:   {"arithmetic": 20, "span": 10, "multi-span": 10, "count": 10},
    200:  None,
    1000: None,
    3000: None,
    6000: None,
}

# Citation leakage phrases
CITATION_LEAK_PHRASES = [
    "according to the source",
    "according to the table",
    "based on the provided context",
    "as mentioned in the paragraph",
    "the source states",
    "citation",
    "retrieved",
    "evidence says",
    "from paragraph",
    "from the table",
    "in paragraph",
    "in the table",
    "in row",
    "on page",
    "evidence",
]

# Minimum pass rate before scaling to the next batch size
MIN_PASS_RATE = 0.90
