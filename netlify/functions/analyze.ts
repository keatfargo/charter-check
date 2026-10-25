import type { Handler } from "@netlify/functions";

import { analyzeCharterVsTranscript } from "../lib/analyze";
import { isAiConfigured, missingKeyMessage } from "../lib/env";
import { extractText } from "../lib/extractText";
import { errorResponse, json } from "../lib/http";
import { parseMultipart } from "../lib/parseMultipart";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return errorResponse(405, "Method not allowed");
  }
  if (!isAiConfigured()) {
    return errorResponse(503, missingKeyMessage());
  }

  try {
    const files = await parseMultipart(event);
    const charter = files.find((f) => f.field === "charter");
    const transcript = files.find((f) => f.field === "transcript");

    if (!charter?.filename || !transcript?.filename) {
      return errorResponse(400, "Both charter and transcript files are required.");
    }
    if (!charter.data.length || !transcript.data.length) {
      return errorResponse(400, "Both files must be non-empty.");
    }

    const charterText = await extractText(charter.filename, charter.data);
    const transcriptText = await extractText(transcript.filename, transcript.data);

    if (charterText.length < 50) {
      return errorResponse(400, "Charter text is too short to analyze.");
    }
    if (transcriptText.length < 50) {
      return errorResponse(400, "Transcript text is too short to analyze.");
    }

    const report = await analyzeCharterVsTranscript(charterText, transcriptText);
    return json(200, report);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Analysis failed";
    const status = message.includes("Unsupported file") ? 400 : 502;
    return errorResponse(status, message);
  }
};
