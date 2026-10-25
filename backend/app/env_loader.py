"""Load OPENAI_API_KEY from project-root .env (reloads on each call for dev)."""

import os
import re
from pathlib import Path

from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parents[2]
_ENV_FILE = _ROOT / ".env"


def reload_project_env() -> None:
    if _ENV_FILE.is_file():
        load_dotenv(_ENV_FILE, override=True)


def _normalize_openai_key(raw: str) -> str:
    key = raw.strip().strip('"').strip("'")
    if not key:
        return ""
    if key.startswith("sk-"):
        return key
    # Dashboard copy sometimes omits the sk-proj- prefix.
    if re.fullmatch(r"[A-Za-z0-9_-]{40,}", key):
        return f"sk-proj-{key}"
    return key


def get_openai_api_key() -> str:
    reload_project_env()
    key = _normalize_openai_key(os.getenv("OPENAI_API_KEY") or "")
    if key:
        return key

    if not _ENV_FILE.is_file():
        return ""

    for raw in _ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("OPENAI_API_KEY="):
            return _normalize_openai_key(line.split("=", 1)[1])
        # Common mistake: paste only sk-… on a single line with no variable name
        if "=" not in line and (line.startswith("sk-") or re.fullmatch(r"[A-Za-z0-9_-]{40,}", line)):
            return _normalize_openai_key(line)

    return ""


def get_openai_model() -> str:
    reload_project_env()
    return (os.getenv("OPENAI_MODEL") or "gpt-4o-mini").strip()
