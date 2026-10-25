import { useEffect, useMemo, useState } from "react";
import { checkBackend, parseApiError, type ApiStatus, type BackendCheck } from "./api";
import { DEMO_REPORT } from "./demoReport";
import type { AnalysisReport, MemberReport } from "./types";

function scoreColor(score: number): string {
  if (score >= 75) return "var(--good)";
  if (score >= 50) return "var(--mid)";
  return "var(--low)";
}

function MemberCard({ member }: { member: MemberReport }) {
  return (
    <article className="member-card">
      <header className="member-header">
        <div>
          <h3>{member.name}</h3>
          {member.role ? <p className="role">{member.role}</p> : null}
        </div>
        <div
          className="score-pill"
          style={{ borderColor: scoreColor(member.overall_score) }}
        >
          <span className="score-value" style={{ color: scoreColor(member.overall_score) }}>
            {Math.round(member.overall_score)}
          </span>
          <span className="score-label">overall</span>
        </div>
      </header>
      <ul className="resp-list">
        {member.responsibilities.map((r) => (
          <li key={r.responsibility} className="resp-item">
            <div className="resp-top">
              <strong>{r.responsibility}</strong>
              <span className="mini-score" style={{ color: scoreColor(r.score) }}>
                {Math.round(r.score)}
              </span>
            </div>
            <p className="resp-summary">{r.summary}</p>
            {r.evidence.length > 0 ? (
              <ul className="evidence">
                {r.evidence.map((e, i) => (
                  <li key={i}>
                    <blockquote>{e.quote}</blockquote>
                    <p>{e.assessment}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function App() {
  const [charter, setCharter] = useState<File | null>(null);
  const [transcript, setTranscript] = useState<File | null>(null);
  const [backend, setBackend] = useState<BackendCheck>({ state: "loading" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [reportNote, setReportNote] = useState<string | null>(null);

  useEffect(() => {
    checkBackend().then(setBackend);
  }, []);

  const apiStatus: ApiStatus | null =
    backend.state === "ready" || backend.state === "ai_off" ? backend.status : null;
  const liveAiReady = backend.state === "ready";

  const canSubmitUpload = useMemo(
    () => charter && transcript && !loading,
    [charter, transcript, loading],
  );

  async function runLiveAnalysis(
    request: () => Promise<Response>,
    note: string,
  ) {
    setLoading(true);
    setError(null);
    setReport(null);
    setReportNote(null);

    const check = await checkBackend();
    setBackend(check);
    if (check.state === "unreachable") {
      setError(check.message);
      setLoading(false);
      return;
    }
    if (check.state === "ai_off") {
      setError(
        "Live AI is off: set OPENAI_API_KEY in Vercel Environment Variables (or in .env locally), then redeploy.",
      );
      setLoading(false);
      return;
    }

    try {
      const res = await request();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(parseApiError(data.detail, `Request failed (${res.status})`));
      }
      setReport(data as AnalysisReport);
      setReportNote(note);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function onAnalyzeUpload() {
    if (!charter || !transcript) return;
    const body = new FormData();
    body.append("charter", charter);
    body.append("transcript", transcript);
    const model = apiStatus?.model ?? "OpenAI";
    runLiveAnalysis(
      () => fetch("/api/analyze", { method: "POST", body }),
      `Live AI analysis (${model}). Scores and quotes are generated from your uploads.`,
    );
  }

  function onAnalyzeSampleLive() {
    const model = apiStatus?.model ?? "OpenAI";
    runLiveAnalysis(
      () => fetch("/api/analyze/sample", { method: "POST" }),
      `Live AI analysis (${model}) on sample/team-charter.txt and sample/meeting-transcript.txt.`,
    );
  }

  async function onPreviewDemoReport() {
    setLoading(true);
    setError(null);
    setReport(null);
    setReportNote(null);
    await new Promise((r) => setTimeout(r, 600));
    try {
      const res = await fetch("/api/demo-report");
      setReport(res.ok ? ((await res.json()) as AnalysisReport) : DEMO_REPORT);
    } catch {
      setReport(DEMO_REPORT);
    }
    setReportNote("Static demo report — no API call. Use live AI buttons for real scoring.");
    setLoading(false);
  }

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Est. 2026 · Team alignment</p>
        <div className="hero-badges" aria-hidden="true">
          <span className="hero-badge">Charter vs transcript</span>
          <span className="hero-badge">Quote-backed scores</span>
        </div>
        <h1>Charter Check</h1>
        <p className="lede">
          See whether the meeting matched what your team wrote in the charter—with scores and
          transcript quotes for each responsibility.
        </p>
      </header>

      <section className="info-panel" aria-labelledby="about-heading">
        <h2 id="about-heading">What this tool does</h2>
        <p>
          Charter Check compares your <strong>team charter</strong> (who owns what) to a{" "}
          <strong>meeting transcript</strong> (what actually happened). For each person, it scores
          every listed duty and backs it up with <strong>quotes from the meeting</strong>—useful for
          retros, not for grading.
        </p>
        <div className="guide-card">
          <h4>How to use it</h4>
          <ol className="guide-steps">
            <li>
              <span className="step-num">1</span>
              <span>
                <strong>Try the sample</strong> — click <strong>Run live AI on sample team</strong> to
                see a full example report (no files needed).
              </span>
            </li>
            <li>
              <span className="step-num">2</span>
              <span>
                <strong>Use your team&apos;s files</strong> — upload the charter and meeting
                transcript (.txt, .md, .pdf, or .docx), then run live AI on the uploads.
              </span>
            </li>
            <li>
              <span className="step-num">3</span>
              <span>
                <strong>Read the report</strong> — team summary first, then each member (scores per
                duty with evidence), then gaps and ideas for the next meeting.
              </span>
            </li>
          </ol>
        </div>
      </section>

      <p
        className={`api-status-line ${
          backend.state === "loading"
            ? ""
            : backend.state === "ready"
              ? "ok"
              : backend.state === "unreachable"
                ? "err"
                : "warn"
        }`}
        role="status"
        aria-live="polite"
      >
        {backend.state === "loading"
          ? "Checking API…"
          : backend.state === "ready"
            ? `Live AI ready (${backend.status.model}) — sample and uploads use your OpenAI key.`
            : backend.state === "ai_off"
              ? `API is up but OPENAI_API_KEY is missing (model: ${backend.status.model}). Add the key in Vercel env vars and redeploy.`
              : backend.message}
      </p>

      <section className="upload-panel">
        <div className="prototype-actions">
          <button
            type="button"
            className="btn-primary-action"
            disabled={loading || !liveAiReady}
            onClick={onAnalyzeSampleLive}
          >
            {loading ? "Analyzing…" : "Run live AI on sample team"}
          </button>
          <button type="button" className="btn-secondary" disabled={loading} onClick={onPreviewDemoReport}>
            Preview static demo report
          </button>
        </div>
        <div className="field">
          <label htmlFor="charter">Team charter</label>
          <input
            id="charter"
            type="file"
            accept=".txt,.md,.pdf,.docx"
            onChange={(e) => setCharter(e.target.files?.[0] ?? null)}
          />
          {charter ? <span className="file-name">{charter.name}</span> : null}
        </div>
        <div className="field">
          <label htmlFor="transcript">Meeting transcript</label>
          <input
            id="transcript"
            type="file"
            accept=".txt,.md,.pdf,.docx"
            onChange={(e) => setTranscript(e.target.files?.[0] ?? null)}
          />
          {transcript ? <span className="file-name">{transcript.name}</span> : null}
        </div>
        <button
          type="button"
          className="btn-primary-action"
          disabled={!canSubmitUpload || !liveAiReady}
          onClick={onAnalyzeUpload}
        >
          {loading ? "Analyzing…" : "Run live AI on uploads"}
        </button>
        {error ? <p className="error" role="alert">{error}</p> : null}
      </section>

      {report ? (
        <section className="results">
          {reportNote ? <p className="report-banner">{reportNote}</p> : null}
          <div className="summary-card">
            <h2>Team summary</h2>
            <p>{report.team_summary}</p>
            {report.charter_roles_extracted.length > 0 ? (
              <>
                <h3>Roles from charter</h3>
                <ul className="roles-chips">
                  {report.charter_roles_extracted.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>

          <h2 className="section-title">By team member</h2>
          <div className="member-grid">
            {report.members.map((m) => (
              <MemberCard key={m.name} member={m} />
            ))}
          </div>

          {report.gaps_and_recommendations.length > 0 ? (
            <div className="summary-card recs">
              <h2>Gaps & recommendations</h2>
              <ul>
                {report.gaps_and_recommendations.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
