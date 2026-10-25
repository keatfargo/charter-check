import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Handler } from "@netlify/functions";

import { analyzeCharterVsTranscript } from "../lib/analyze";
import { isAiConfigured, missingKeyMessage } from "../lib/env";
import { errorResponse, json } from "../lib/http";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return errorResponse(405, "Method not allowed");
  }
  if (!isAiConfigured()) {
    return errorResponse(503, missingKeyMessage());
  }

  const root = process.cwd();
  const charterPath = join(root, "sample", "team-charter.txt");
  const transcriptPath = join(root, "sample", "meeting-transcript.txt");

  try {
    const charterText = readFileSync(charterPath, "utf8");
    const transcriptText = readFileSync(transcriptPath, "utf8");
    const report = await analyzeCharterVsTranscript(charterText, transcriptText);
    return json(200, report);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Analysis failed";
    return errorResponse(502, message);
  }
};
