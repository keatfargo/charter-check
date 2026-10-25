import type { Handler } from "@netlify/functions";

import { getOpenAiModel, isAiConfigured } from "../lib/env";
import { json } from "../lib/http";

export const handler: Handler = async () =>
  json(200, {
    ai_configured: isAiConfigured(),
    model: getOpenAiModel(),
  });
