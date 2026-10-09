import type { ApiResult } from "../../lib/api/types";
import { apiErrorResponse, jsonResponse } from "../../lib/http";

const MAX_BODY_CHARS = 16 * 1024;

export type JsonBody = Record<string, unknown>;

export async function readJsonBody(request: Request): Promise<JsonBody | Response> {
  const text = await request.text();
  if (text.length > MAX_BODY_CHARS) return apiErrorResponse(413, "payload_too_large", "request body is too large");
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as JsonBody;
  } catch {
    /* fall through */
  }
  return apiErrorResponse(400, "bad_request", "request body must be a JSON object");
}

export const str = (body: JsonBody, key: string): string => {
  const value = body[key];
  return typeof value === "string" ? value : "";
};

export function forwardResult<T>(result: ApiResult<T>, what: string): Response {
  if (result.ok) return jsonResponse(result.data, 201);
  const { status, error } = result;
  if (status === 429) {
    return apiErrorResponse(429, "rate_limited", error?.message ?? "You're posting too fast. Please slow down.");
  }
  if (status === 400 || status === 413 || status === 422) {
    return jsonResponse(
      { error: { code: error?.code ?? "validation_failed", message: error?.message ?? "invalid input", details: error?.details ?? {} } },
      status === 413 ? 413 : 400,
    );
  }
  console.error(JSON.stringify({ level: "error", msg: `forwarding ${what} failed`, status, code: error?.code }));
  return apiErrorResponse(503, "unavailable", `Unable to send your ${what} right now. Please try again later.`);
}
