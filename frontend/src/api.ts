export interface ApiStatus {
  ai_configured: boolean;
  model: string;
}

export type BackendCheck =
  | { state: "loading" }
  | { state: "ready"; status: ApiStatus }
  | { state: "ai_off"; status: ApiStatus }
  | { state: "unreachable"; message: string };

export function parseApiError(detail: unknown, fallback: string): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (item && typeof item === "object" && "msg" in item) {
          return String((item as { msg: string }).msg);
        }
        return String(item);
      })
      .join(" ");
  }
  return fallback;
}

export async function checkBackend(): Promise<BackendCheck> {
  try {
    const res = await fetch("/api/status");
    const contentType = res.headers.get("content-type") ?? "";

    if (!res.ok) {
      return {
        state: "unreachable",
        message: `API returned ${res.status}. The backend may not be deployed (check Vercel /api routes).`,
      };
    }

    if (!contentType.includes("application/json")) {
      return {
        state: "unreachable",
        message:
          "API did not return JSON (often the SPA index.html). Fix Vercel: deploy latest main with vercel.json and /api serverless function.",
      };
    }

    const status = (await res.json()) as ApiStatus;
    if (!status.ai_configured) {
      return { state: "ai_off", status };
    }
    return { state: "ready", status };
  } catch {
    return {
      state: "unreachable",
      message:
        "Cannot reach /api/status. Start the server locally (./scripts/run-prototype.sh) or fix the Vercel deployment.",
    };
  }
}

/** @deprecated use checkBackend */
export async function fetchApiStatus(): Promise<ApiStatus | null> {
  const check = await checkBackend();
  if (check.state === "ready" || check.state === "ai_off") return check.status;
  return null;
}
