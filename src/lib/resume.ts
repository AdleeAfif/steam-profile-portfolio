import type { Achievement, Skill } from "./api/types";

export const RESUME_PATH = "/resume";

const SHARED_PREFIXES = ["/_astro/", "/favicon.", `${RESUME_PATH}/`, "/api/health"];

export type ResumeRoute = { kind: "rewrite"; path: string } | { kind: "redirect"; location: string } | null;

export function resumeOrigin(siteUrl: string, resumeHost: string): string {
  const url = new URL(siteUrl);
  url.hostname = resumeHost;
  return url.origin;
}

export function resumeCanonical(siteUrl: string, resumeHost: string | undefined): string {
  return resumeHost ? `${resumeOrigin(siteUrl, resumeHost)}/` : new URL(RESUME_PATH, siteUrl).toString();
}

export function resumeRoute(url: URL, siteUrl: string, resumeHost: string | undefined): ResumeRoute {
  if (!resumeHost) return null;
  const path = url.pathname;
  if (url.hostname === resumeHost) {
    if (path === "/") return { kind: "rewrite", path: RESUME_PATH };
    if (SHARED_PREFIXES.some((prefix) => path.startsWith(prefix))) return null;
    return { kind: "redirect", location: new URL(path + url.search, siteUrl).toString() };
  }
  if (path === RESUME_PATH || path === `${RESUME_PATH}/`) {
    return { kind: "redirect", location: `${resumeOrigin(siteUrl, resumeHost)}/` };
  }
  return null;
}

export function focusAreas(headline: string | undefined): string[] {
  if (!headline) return [];
  const tail = headline.split("|").pop() ?? "";
  return tail
    .split(/,|\band\b/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1));
}

export const byTier = (a: Skill, b: Skill) => b.tier - a.tier || a.order - b.order;

export function topSkillsFor(companyId: string, skills: Skill[], limit = 4): Skill[] {
  return skills.filter((s) => s.companyIds.includes(companyId)).sort(byTier).slice(0, limit);
}

export function recentMilestones(achievements: Achievement[], limit = 4): Achievement[] {
  return achievements
    .filter((a): a is Achievement & { unlockedAt: string } => Boolean(a.unlockedAt))
    .sort((a, b) => b.unlockedAt.localeCompare(a.unlockedAt))
    .slice(0, limit);
}
