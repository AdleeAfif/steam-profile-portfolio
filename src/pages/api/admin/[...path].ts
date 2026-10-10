import type { APIRoute } from "astro";
import { forwardAdmin, isProxyablePath } from "../../../lib/api/admin";
import { apiErrorResponse, clientIp } from "../../../lib/http";
import { clearSession, readSession } from "../../../lib/session";

const MAX_BODY_CHARS = 1024 * 1024;
const WITH_BODY = new Set(["POST", "PUT", "PATCH"]);

export const ALL: APIRoute = async ({ request, params, url, cookies }) => {
  if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    return apiErrorResponse(405, "method_not_allowed", "method not allowed");
  }
  const token = readSession(cookies);
  if (!token) return apiErrorResponse(401, "unauthorized", "authentication required");

  const path = params.path ?? "";
  if (!isProxyablePath(path) || path === "logout") return apiErrorResponse(404, "not_found", "resource not found");

  let body: string | null = null;
  if (WITH_BODY.has(request.method)) {
    body = await request.text();
    if (body.length > MAX_BODY_CHARS) return apiErrorResponse(413, "payload_too_large", "request body is too large");
    if (body === "") body = null;
    else if (!(request.headers.get("Content-Type") ?? "").includes("application/json")) {
      return apiErrorResponse(415, "bad_request", "content type must be application/json");
    }
  }

  const response = await forwardAdmin(token, clientIp(request), request.method, path, url.search, body);
  if (response.status === 401) clearSession(cookies);
  return response;
};
