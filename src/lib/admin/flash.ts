import type { AstroCookies } from "astro";

const FLASH_COOKIE = "spp_flash";

export interface Flash {
  kind: "ok" | "error";
  message: string;
}

export function setFlash(cookies: AstroCookies, kind: Flash["kind"], message: string): void {
  cookies.set(FLASH_COOKIE, JSON.stringify({ kind, message }), {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/admin",
    maxAge: 60,
  });
}

export function takeFlash(cookies: AstroCookies): Flash | null {
  const raw = cookies.get(FLASH_COOKIE)?.value;
  if (!raw) return null;
  cookies.delete(FLASH_COOKIE, { path: "/admin", httpOnly: true, secure: true, sameSite: "strict" });
  try {
    const parsed = JSON.parse(raw) as Partial<Flash>;
    if ((parsed.kind === "ok" || parsed.kind === "error") && typeof parsed.message === "string") {
      return { kind: parsed.kind, message: parsed.message.slice(0, 300) };
    }
  } catch {
    /* ignore malformed cookie */
  }
  return null;
}
