import os
from dotenv import load_dotenv
import httpx

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
QDRANT_HOST = os.getenv("QDRANT_HOST", "").strip()
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "").strip()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()


def test_supabase():
    print("\n--- Supabase ---")
    try:
        url = f"{SUPABASE_URL}/rest/v1/"
        headers = {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        }
        r = httpx.get(url, headers=headers, timeout=10)
        if r.status_code == 200:
            print("Connected.")
            print("PASS")
        else:
            print(f"FAIL — HTTP {r.status_code}: {r.text}")
    except Exception as e:
        print(f"FAIL — {e}")


def test_qdrant():
    print("\n--- Qdrant ---")
    try:
        url = f"{QDRANT_HOST}/collections"
        headers = {"api-key": QDRANT_API_KEY}
        r = httpx.get(url, headers=headers, timeout=10)
        if r.status_code == 200:
            collections = r.json().get("result", {}).get("collections", [])
            if collections:
                print("Collections:")
                for c in collections:
                    print(f"  - {c['name']}")
            else:
                print("Connected — no collections yet.")
            print("PASS")
        else:
            print(f"FAIL — HTTP {r.status_code}: {r.text}")
    except Exception as e:
        print(f"FAIL — {e}")


def test_openai():
    print("\n--- OpenAI ---")
    try:
        url = "https://api.openai.com/v1/models"
        headers = {"Authorization": f"Bearer {OPENAI_API_KEY}"}
        r = httpx.get(url, headers=headers, timeout=10)
        if r.status_code == 200:
            print("OpenAI connected.")
            print("PASS")
        else:
            print(f"FAIL — HTTP {r.status_code}: {r.text}")
    except Exception as e:
        print(f"FAIL — {e}")


if __name__ == "__main__":
    test_supabase()
    test_qdrant()
    test_openai()
    print()
