#!/usr/bin/env bash
# One-time setup: Python 3.11+ venv + pip install
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

exec "$ROOT/scripts/run-prototype.sh" 2>/dev/null || true

# run-prototype creates venv if possible; if old venv exists, user must rm -rf backend/.venv first
if [[ -d backend/.venv ]]; then
  # shellcheck disable=SC1091
  source backend/.venv/bin/activate
  if python -c 'import sys; exit(0 if sys.version_info >= (3, 11) else 1)'; then
    pip install --upgrade pip
    pip install -r backend/requirements.txt
    echo "OK. Start the app: ./scripts/run-prototype.sh"
    exit 0
  fi
fi

echo "Remove old venv if you upgraded Python:"
echo "  rm -rf $ROOT/backend/.venv"
echo "Then run: ./scripts/run-prototype.sh"
