import { SITE_URL, TRUST_CF_HEADERS } from "astro:env/server";

export const PUBLIC_CACHE = "public, max-age=0, s-maxage=60, stale-while-revalidate=300";
export const PRIVATE_CACHE = "private, no-store";

export function clientIp(request: Request, fallback?: string): string | null {
  if (TRUST_CF_HEADERS) {
    const ip = request.headers.get("CF-Connecting-IP")?.trim();
    if (ip) return ip;
    return null;
  }
  return fallback ?? null;
}

// Astro ignores Host unless security.allowedDomains is set, so url.hostname is "localhost" in production.
export function requestHostname(request: Request, url: URL): string {
  const host = request.headers.get("host");
  if (!host) return url.hostname;
  try {
    return new URL(`http://${host}`).hostname;
  } catch {
    return url.hostname;
  }
}

export function safeClientAddress(getter: () => string): string | undefined {
  try {
    return getter();
  } catch {
    return undefined;
  }
}

export function siteOrigin(): string {
  return new URL(SITE_URL).origin;
}

export function wwwAlias(site: URL = new URL(SITE_URL)): string | null {
  if (site.hostname.startsWith("www.") || !site.hostname.includes(".")) return null;
  return `www.${site.hostname}`;
}

export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return false;
  const site = new URL(SITE_URL);
  if (origin === site.origin) return true;
  const alias = wwwAlias(site);
  return alias !== null && origin === `${site.protocol}//${alias}${site.port ? `:${site.port}` : ""}`;
}

export function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { "Cache-Control": PRIVATE_CACHE, ...headers } });
}

export function apiErrorResponse(status: number, code: string, message: string): Response {
  return jsonResponse({ error: { code, message } }, status);
}
