import type { Handler } from "@netlify/functions";

import { DEMO_REPORT } from "../lib/demoReport";
import { json } from "../lib/http";

export const handler: Handler = async () => json(200, DEMO_REPORT);
