/** True when a user key or Netlify AI Gateway credentials are available. */
export function isAiConfigured(): boolean {
  return Boolean(getOpenAiKey() || process.env.NETLIFY_AI_GATEWAY_KEY?.trim());
}

export function getOpenAiKey(): string {
  const raw = (process.env.OPENAI_API_KEY ?? "").trim();
  if (!raw) return "";
  if (raw.startsWith("sk-")) return raw;
  if (/^[A-Za-z0-9_-]{40,}$/.test(raw)) return `sk-proj-${raw}`;
  return raw;
}

export function getOpenAiModel(): string {
  return (process.env.OPENAI_MODEL ?? "gpt-4o-mini").trim();
}

export function missingKeyMessage(): string {
  return (
    "Live AI is off. On Netlify, enable AI Gateway (credit plan + one production deploy) " +
    "or set OPENAI_API_KEY in Site settings → Environment variables."
  );
}
