import OpenAI from "openai";

import { getOpenAiKey, getOpenAiModel, isAiConfigured, missingKeyMessage } from "./env";

const SYSTEM_PROMPT = `You are an expert facilitator reviewing team meetings against a team charter.
Extract each member and their responsibilities from the charter. Score 0-100 how well the transcript shows each duty, with short real quotes as evidence.
Use only transcript evidence. Include every charter member in members[]. Be fair and specific.`;

const USER_TEMPLATE = (charter: string, transcript: string) =>
  `## Team charter\n\n${charter}\n\n## Meeting transcript\n\n${transcript}\n\nReturn one JSON object with keys: team_summary (string), charter_roles_extracted (string[]), members (array of {name, role, overall_score, responsibilities: [{responsibility, score, summary, evidence: [{quote, assessment}]}]}), gaps_and_recommendations (string[]).`;

function createClient(): OpenAI {
  const apiKey = getOpenAiKey() || process.env.NETLIFY_AI_GATEWAY_KEY?.trim();
  const baseURL =
    process.env.OPENAI_BASE_URL?.trim() || process.env.NETLIFY_AI_GATEWAY_URL?.trim();

  // Prefer injected env (Netlify AI Gateway sets OPENAI_API_KEY + OPENAI_BASE_URL).
  if (!apiKey && !baseURL) {
    return new OpenAI();
  }
  return new OpenAI({
    ...(apiKey ? { apiKey } : {}),
    ...(baseURL ? { baseURL } : {}),
  });
}

export async function analyzeCharterVsTranscript(
  charterText: string,
  transcriptText: string,
): Promise<Record<string, unknown>> {
  if (!isAiConfigured()) {
    throw new Error(missingKeyMessage());
  }

  const client = createClient();
  const model = getOpenAiModel();
  const charter = charterText.slice(0, 80_000);
  const transcript = transcriptText.slice(0, 80_000);

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: USER_TEMPLATE(charter, transcript) },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  return JSON.parse(raw) as Record<string, unknown>;
}
