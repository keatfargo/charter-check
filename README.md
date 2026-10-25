# Charter Check

Teams upload a **team charter** and a **meeting transcript**; Charter Check compares what each person committed to in the charter with what showed up in the meeting and produces a scored report with transcript evidence.

## Prerequisites

- Python 3.11+
- Node.js 18+
- An [OpenAI API key](https://platform.openai.com/api-keys)

## Live AI scoring

1. Create an API key at [OpenAI](https://platform.openai.com/api-keys).
2. In the project root:

```bash
cp .env.example .env
```

3. Set `OPENAI_API_KEY` in `.env`. Optional: `OPENAI_MODEL` (default `gpt-4o-mini`).
4. Start the backend and frontend (below). The UI shows **Live AI ready** when the key is loaded.
5. Use **Run live AI on sample team** or upload your charter + transcript and click **Run live AI on uploads**.

Analysis calls OpenAI with structured output (Pydantic schema). Each run uses your API quota.

## Setup

```bash
cp .env.example .env
# Edit .env and set OPENAI_API_KEY for live scoring
```

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173, upload your charter and transcript, then run analysis.

## Prototype (test live AI)

One command serves the API and the test UI (no Node required):

```bash
cd ~/charter-check
cp .env.example .env   # set OPENAI_API_KEY
cd backend && python3.11 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
cd .. && ./scripts/run-prototype.sh
```

Open **http://127.0.0.1:8000/prototype/** and click **Test live AI (sample team)** or upload your charter + transcript.

Do not open `prototype/index.html` directly from the filesystem; the browser cannot call the API reliably that way.

## Supported file types

- Charter & transcript: `.txt`, `.md`, `.pdf`, `.docx`

## How it works

1. Text is extracted from both uploads.
2. An OpenAI model reads the charter to list roles and responsibilities.
3. The same model scores each person against the transcript and cites short quotes as evidence.

Results are advisory—use them for team reflection, not performance management without context.
