import type { Handler } from "@netlify/functions";

import { json } from "../lib/http";

export const handler: Handler = async () => json(200, { status: "ok" });
