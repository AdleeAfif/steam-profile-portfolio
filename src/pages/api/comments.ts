import type { APIRoute } from "astro";
import { createComment, listComments } from "../../lib/api/public";
import { apiErrorResponse, clientIp, jsonResponse, safeClientAddress } from "../../lib/http";
import { forwardResult, readJsonBody, str } from "./_forward";

export const GET: APIRoute = async ({ url }) => {
  const cursor = url.searchParams.get("cursor") || undefined;
  const rawLimit = url.searchParams.get("limit");
  const limit = rawLimit === null ? undefined : Number(rawLimit);
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 100)) {
    return apiErrorResponse(400, "bad_request", "limit must be an integer between 1 and 100");
  }
  const result = await listComments({ ...(cursor ? { cursor } : {}), ...(limit ? { limit } : {}) });
  if (result.ok) return jsonResponse(result.data);
  if (result.status === 400) {
    return apiErrorResponse(400, "bad_request", result.error?.message ?? "invalid cursor");
  }
  return apiErrorResponse(503, "unavailable", "comments are unavailable");
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const body = await readJsonBody(request);
  if (body instanceof Response) return body;

  const result = await createComment(
    { name: str(body, "name"), message: str(body, "message"), website: str(body, "website") },
    clientIp(request, safeClientAddress(() => clientAddress)),
  );
  return forwardResult(result, "comment");
};
