export interface ApiStatus {
  ai_configured: boolean;
  model: string;
}

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

export async function fetchApiStatus(): Promise<ApiStatus | null> {
  try {
    const res = await fetch("/api/status");
    if (!res.ok) return null;
    return (await res.json()) as ApiStatus;
  } catch {
    return null;
  }
}
