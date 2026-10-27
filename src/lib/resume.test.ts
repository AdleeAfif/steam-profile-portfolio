import { describe, expect, it } from "vitest";
import { focusAreas, recentMilestones, resumeCanonical, resumeRoute } from "./resume";
import type { Achievement } from "./api/types";

const SITE = "https://adlee.my";
const HOST = "cv.adlee.my";
const route = (href: string) => resumeRoute(new URL(href), SITE, HOST);

describe("resumeRoute", () => {
  it("does nothing without a resume host", () => {
    expect(resumeRoute(new URL("https://adlee.my/resume"), SITE, undefined)).toBeNull();
  });

  it("serves the resume at the subdomain root", () => {
    expect(route("https://cv.adlee.my/")).toEqual({ kind: "rewrite", path: "/resume" });
  });

  it("lets shared assets and health checks through on the subdomain", () => {
    for (const path of ["/_astro/app.css", "/favicon.svg", "/resume/adlee.jpg", "/api/health"]) {
      expect(route(`https://cv.adlee.my${path}`)).toBeNull();
    }
  });

  it("sends other subdomain paths to the main site", () => {
    expect(route("https://cv.adlee.my/games?x=1")).toEqual({ kind: "redirect", location: "https://adlee.my/games?x=1" });
  });

  it("sends /resume on the main site to the subdomain", () => {
    expect(route("https://adlee.my/resume")).toEqual({ kind: "redirect", location: "https://cv.adlee.my/" });
    expect(route("https://adlee.my/resume/")).toEqual({ kind: "redirect", location: "https://cv.adlee.my/" });
    expect(route("https://adlee.my/resume/adlee.jpg")).toBeNull();
  });

  it("keeps the dev port", () => {
    expect(resumeRoute(new URL("http://localhost:4321/resume"), "http://localhost:4321", "cv.localhost")).toEqual({
      kind: "redirect",
      location: "http://cv.localhost:4321/",
    });
  });
});

describe("resumeCanonical", () => {
  it("uses the subdomain when set", () => {
    expect(resumeCanonical(SITE, HOST)).toBe("https://cv.adlee.my/");
    expect(resumeCanonical(SITE, undefined)).toBe("https://adlee.my/resume");
  });
});

describe("focusAreas", () => {
  it("splits the part after the last pipe", () => {
    expect(focusAreas("Cloud Native Engineer | Kubernetes, GPU workload orchestration and backend systems")).toEqual([
      "Kubernetes",
      "GPU workload orchestration",
      "Backend systems",
    ]);
    expect(focusAreas(undefined)).toEqual([]);
  });
});

describe("recentMilestones", () => {
  it("keeps unlocked ones, newest first", () => {
    const a = (id: string, unlockedAt?: string) => ({ id, unlockedAt }) as Achievement;
    expect(recentMilestones([a("old", "2023-01-01"), a("locked"), a("new", "2026-01-01")]).map((m) => m.id)).toEqual([
      "new",
      "old",
    ]);
  });
});
