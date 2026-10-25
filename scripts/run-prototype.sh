#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

MIN_PY=311

python_ok() {
  "$1" -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 11) else 1)' 2>/dev/null
}

find_python() {
  local candidates=(
    python3.12 python3.11 python3.10
    /opt/homebrew/bin/python3.12 /opt/homebrew/bin/python3.11
    /usr/local/bin/python3.12 /usr/local/bin/python3.11
    python3
  )
  local c
  for c in "${candidates[@]}"; do
    if command -v "$c" >/dev/null 2>&1 && python_ok "$c"; then
      echo "$c"
      return 0
    fi
  done
  return 1
}

create_venv() {
  if PY="$(find_python)"; then
    echo "Creating venv with: $PY"
    "$PY" -m venv .venv
    return 0
  fi
  if command -v uv >/dev/null 2>&1; then
    echo "Creating venv with uv (Python 3.12)…"
    uv venv --python 3.12 .venv
    return 0
  fi
  if [[ -x "$HOME/.local/bin/uv" ]]; then
    echo "Creating venv with uv (Python 3.12)…"
    "$HOME/.local/bin/uv" venv --python 3.12 .venv
    return 0
  fi
  echo "ERROR: Charter Check needs Python 3.11 or newer."
  echo "Install Python from https://www.python.org/downloads/ or install uv:"
  echo "  curl -LsSf https://astral.sh/uv/install.sh | sh"
  exit 1
}

if [[ ! -d .venv ]]; then
  echo "No backend/.venv yet."
  create_venv
fi

# shellcheck disable=SC1091
source .venv/bin/activate

if ! python_ok python; then
  echo "Recreating backend/.venv (was $(python --version 2>&1); need 3.11+)."
  deactivate 2>/dev/null || true
  rm -rf .venv
  create_venv
  # shellcheck disable=SC1091
  source .venv/bin/activate
fi

if ! python -c "import uvicorn" 2>/dev/null; then
  echo "Installing dependencies (first time)…"
  if command -v uv >/dev/null 2>&1; then
    uv pip install -r requirements.txt
  elif [[ -x "$HOME/.local/bin/uv" ]]; then
    "$HOME/.local/bin/uv" pip install -r requirements.txt
  else
    pip install --upgrade pip
    pip install -r requirements.txt
  fi
fi

if [[ ! -f "$ROOT/.env" ]]; then
  echo "Warning: $ROOT/.env missing. Copy .env.example to .env and set OPENAI_API_KEY for live AI."
fi

echo "Prototype: http://127.0.0.1:8000/prototype/"
exec python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
