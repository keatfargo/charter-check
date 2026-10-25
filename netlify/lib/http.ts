import type { HandlerResponse } from "@netlify/functions";

export function json(
  statusCode: number,
  body: unknown,
  extraHeaders?: Record<string, string>,
): HandlerResponse {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

export function errorResponse(statusCode: number, detail: string): HandlerResponse {
  return json(statusCode, { detail });
}
