#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"
VENV_PY="$ROOT/backend/.venv/bin/python"
PORT="${PORT:-8000}"

python_ok() {
  "$1" -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 11) else 1)' 2>/dev/null
}

find_python() {
  local candidates=(
    "$HOME/.local/share/uv/python/cpython-3.12-macos-aarch64-none/bin/python3.12"
    python3.12 python3.11
    /opt/homebrew/bin/python3.12 /opt/homebrew/bin/python3.11
    /usr/local/bin/python3.12 /usr/local/bin/python3.11
    python3
  )
  local c
  for c in "${candidates[@]}"; do
    if [[ -x "$c" ]] || command -v "$c" >/dev/null 2>&1; then
      if python_ok "$c"; then
        echo "$c"
        return 0
      fi
    fi
  done
  return 1
}

create_venv() {
  if command -v uv >/dev/null 2>&1; then
    echo "Creating venv with uv (Python 3.12)…"
    uv venv --python 3.12 .venv
    return 0
  fi
  if PY="$(find_python)"; then
    echo "Creating venv with: $PY"
    "$PY" -m venv .venv
    return 0
  fi
  echo "ERROR: Charter Check needs Python 3.11 or newer."
  echo "Install uv (recommended):"
  echo "  curl -LsSf https://astral.sh/uv/install.sh | sh"
  echo "Then reopen Terminal and run this script again."
  exit 1
}

if [[ ! -x "$VENV_PY" ]] || ! python_ok "$VENV_PY"; then
  rm -rf .venv
  create_venv
  VENV_PY="$ROOT/backend/.venv/bin/python"
fi

if ! "$VENV_PY" -c "import uvicorn" 2>/dev/null; then
  echo "Installing dependencies…"
  if command -v uv >/dev/null 2>&1; then
    uv pip install -p "$VENV_PY" -r requirements.txt
  else
    "$VENV_PY" -m pip install --upgrade pip
    "$VENV_PY" -m pip install -r requirements.txt
  fi
fi

if [[ ! -f "$ROOT/.env" ]]; then
  echo "Warning: $ROOT/.env missing. Copy .env.example to .env and set OPENAI_API_KEY for live AI."
fi

URL="http://127.0.0.1:${PORT}/prototype/"
echo "Prototype: $URL"
echo "Leave this window open. Open that URL if the browser does not appear."

if command -v open >/dev/null 2>&1; then
  (sleep 1.2 && open "$URL") &
fi

exec "$VENV_PY" -m uvicorn app.main:app --reload --host 127.0.0.1 --port "$PORT"
