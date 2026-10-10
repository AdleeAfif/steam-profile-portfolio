import { defineMiddleware } from "astro:middleware";
import { SITE_URL } from "astro:env/server";
import { PRIVATE_CACHE, PUBLIC_CACHE, apiErrorResponse, isAllowedOrigin, wwwAlias } from "./lib/http";
import { readSession } from "./lib/session";
import { trackApiHealth } from "./lib/api/result";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const PUBLIC_ADMIN_PAGES = new Set(["/admin/login", "/admin/login/"]);

const isAdminPage = (path: string) => path === "/admin" || path.startsWith("/admin/");
const isAdminApi = (path: string) => path === "/api/admin" || path.startsWith("/api/admin/");
const isPrivate = (path: string) => isAdminPage(path) || path.startsWith("/api/");

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url } = context;
  const path = url.pathname;

  if ((request.method === "GET" || request.method === "HEAD") && url.hostname === wwwAlias()) {
    return new Response(null, {
      status: 301,
      headers: { Location: new URL(path + url.search, SITE_URL).toString(), "Cache-Control": "public, max-age=3600" },
    });
  }

  if (MUTATING.has(request.method) && !isAllowedOrigin(request)) {
    return apiErrorResponse(403, "forbidden", "cross-origin request blocked");
  }

  if ((isAdminPage(path) && !PUBLIC_ADMIN_PAGES.has(path)) || isAdminApi(path)) {
    if (!readSession(context.cookies)) {
      if (isAdminApi(path)) return apiErrorResponse(401, "unauthorized", "authentication required");
      return new Response(null, {
        status: 303,
        headers: {
          Location: `/admin/login?next=${encodeURIComponent(path + url.search)}`,
          "Cache-Control": PRIVATE_CACHE,
        },
      });
    }
  }

  const { value: response, degraded } = await trackApiHealth(() => next());

  let cacheControl: string | null = null;
  if (isPrivate(path) || response.headers.has("Set-Cookie")) {
    cacheControl = PRIVATE_CACHE;
  } else if (degraded) {
    cacheControl = "no-store";
  } else if (!response.headers.has("Cache-Control")) {
    const okHtml = response.status === 200 && (response.headers.get("Content-Type") ?? "").includes("text/html");
    cacheControl = okHtml ? PUBLIC_CACHE : "no-store";
  }
  if (cacheControl === null) return response;

  try {
    response.headers.set("Cache-Control", cacheControl);
    return response;
  } catch {
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", cacheControl);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
});
