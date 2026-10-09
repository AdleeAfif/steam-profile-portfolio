import type { AstroCookies } from "astro";

export const SESSION_COOKIE = "spp_admin";

export function readSession(cookies: AstroCookies): string | null {
  return cookies.get(SESSION_COOKIE)?.value || null;
}

export function writeSession(cookies: AstroCookies, token: string, expiresAt: string): void {
  const expires = new Date(expiresAt);
  cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    expires: Number.isNaN(expires.getTime()) ? undefined : expires,
  });
}

export function clearSession(cookies: AstroCookies): void {
  cookies.delete(SESSION_COOKIE, { path: "/", httpOnly: true, secure: true, sameSite: "strict" });
}
