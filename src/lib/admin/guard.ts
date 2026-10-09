import type { AstroCookies } from "astro";
import type { ApiResult } from "../api/types";
import { clearSession, readSession } from "../session";

interface AdminContext {
  cookies: AstroCookies;
  url: URL;
  redirect: (path: string, status?: 301 | 302 | 303 | 307 | 308) => Response;
}

export const sessionToken = (cookies: AstroCookies): string => readSession(cookies) ?? "";

export const isUnauthorized = (...results: ApiResult<unknown>[]): boolean =>
  results.some((r) => !r.ok && r.status === 401);

export function safeNext(next: string | null | undefined): string {
  if (!next || next.startsWith("//") || next.includes("\\")) return "/admin";
  if (next === "/admin" || next.startsWith("/admin/") || next.startsWith("/admin?")) return next;
  return "/admin";
}

export function toLogin(ctx: AdminContext): Response {
  clearSession(ctx.cookies);
  const next = ctx.url.pathname === "/admin/logout" ? "/admin" : ctx.url.pathname + ctx.url.search;
  return ctx.redirect(`/admin/login?next=${encodeURIComponent(safeNext(next))}`, 303);
}

export function errorMessage(result: ApiResult<unknown>): string {
  if (result.ok) return "";
  if (result.status === 0) return "profile-api is unreachable. Try again in a moment.";
  if (result.error?.code === "validation_failed") return "Some fields are invalid. Fix the highlighted fields.";
  if (result.status === 409) {
    return result.error?.message
      ? `Conflict: ${result.error.message}. Reload and try again, or pick another id.`
      : "Conflict: the document already exists or was modified.";
  }
  return result.error?.message ?? `Request failed with status ${result.status}.`;
}

export const errorDetails = (result: ApiResult<unknown>): Record<string, string> =>
  (!result.ok && result.error?.details) || {};
