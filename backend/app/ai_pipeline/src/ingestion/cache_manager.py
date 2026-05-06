import hashlib
from pathlib import Path

def get_file_hash(file_path: str | Path) -> str:
    """
    Computes a SHA256 hash of the file content for exact identity checking.
    Matches the file_hash_sha256 column in the Supabase reports table.
    """
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        # Read in blocks for memory safety on large files
        for chunk in iter(lambda: f.read(4096), b""):
            hasher.update(chunk)
    return hasher.hexdigest()
