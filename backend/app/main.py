from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from openai import APIError

from app.analyzer import analyze_charter_vs_transcript
from app.demo_report import DEMO_REPORT
from app.env_loader import get_openai_api_key, get_openai_model, reload_project_env
from app.document_text import extract_text
from app.models import AnalysisReport

_root = Path(__file__).resolve().parents[2]
reload_project_env()

app = FastAPI(title="Charter Check", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "null",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> RedirectResponse:
    return RedirectResponse(url="/prototype/")


app.mount(
    "/prototype",
    StaticFiles(directory=_root / "prototype", html=True),
    name="prototype",
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/status")
def status() -> dict[str, str | bool]:
    key = get_openai_api_key()
    return {
        "ai_configured": bool(key),
        "model": get_openai_model(),
    }


@app.get("/api/demo-report", response_model=AnalysisReport)
def demo_report() -> AnalysisReport:
    return DEMO_REPORT


def _read_sample_text() -> tuple[str, str]:
    charter_path = _root / "sample" / "team-charter.txt"
    transcript_path = _root / "sample" / "meeting-transcript.txt"
    if not charter_path.is_file() or not transcript_path.is_file():
        raise HTTPException(status_code=404, detail="Sample files are missing from the sample/ folder.")
    return charter_path.read_text(encoding="utf-8"), transcript_path.read_text(encoding="utf-8")


@app.post("/api/analyze/sample", response_model=AnalysisReport)
def analyze_sample() -> AnalysisReport:
    charter_text, transcript_text = _read_sample_text()
    return _run_analysis(charter_text, transcript_text)


@app.post("/api/analyze", response_model=AnalysisReport)
async def analyze(
    charter: UploadFile = File(..., description="Team charter document"),
    transcript: UploadFile = File(..., description="Meeting transcript"),
) -> AnalysisReport:
    if not charter.filename or not transcript.filename:
        raise HTTPException(status_code=400, detail="Both files must have filenames.")

    charter_bytes = await charter.read()
    transcript_bytes = await transcript.read()
    if not charter_bytes or not transcript_bytes:
        raise HTTPException(status_code=400, detail="Both files must be non-empty.")

    try:
        charter_text = extract_text(charter.filename, charter_bytes)
        transcript_text = extract_text(transcript.filename, transcript_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    if len(charter_text) < 50:
        raise HTTPException(status_code=400, detail="Charter text is too short to analyze.")
    if len(transcript_text) < 50:
        raise HTTPException(status_code=400, detail="Transcript text is too short to analyze.")

    return _run_analysis(charter_text, transcript_text)


def _run_analysis(charter_text: str, transcript_text: str) -> AnalysisReport:
    if not get_openai_api_key():
        raise HTTPException(
            status_code=503,
            detail=(
                "Live AI is off: add OPENAI_API_KEY=sk-… to charter-check/.env "
                "(project root, not .gitignore), save, then restart ./scripts/run-prototype.sh."
            ),
        )
    try:
        return analyze_charter_vs_transcript(charter_text, transcript_text)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except APIError as e:
        raise HTTPException(status_code=502, detail=f"OpenAI API error: {e}") from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Analysis failed: {e}") from e
