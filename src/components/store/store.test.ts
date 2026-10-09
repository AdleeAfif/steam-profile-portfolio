import { describe, expect, it } from "vitest";
import type { Skill } from "../../lib/api/types";
import { reviewScore } from "./reviewScore";
import { skillTags, systemRequirements } from "./requirements";

const reviews = (yes: number, no: number) => [
  ...Array.from({ length: yes }, () => ({ recommended: true })),
  ...Array.from({ length: no }, () => ({ recommended: false })),
];

describe("reviewScore", () => {
  it.each([
    [0, 0, "No user reviews"],
    [1, 0, "Positive"],
    [495, 5, "Overwhelmingly Positive"],
    [94, 6, "Very Positive"],
    [470, 30, "Very Positive"],
    [8, 2, "Positive"],
    [7, 3, "Mostly Positive"],
    [5, 5, "Mixed"],
    [2, 8, "Mostly Negative"],
    [1, 9, "Negative"],
    [0, 3, "Negative"],
  ])("%i up / %i down -> %s", (yes, no, label) => {
    expect(reviewScore(reviews(yes, no)).label).toBe(label);
  });

  it("reports percent and total", () => {
    expect(reviewScore(reviews(3, 1))).toMatchObject({ percent: 75, total: 4, tone: "positive" });
  });
});

const skill = (id: string, category: Skill["category"], tier: number, order: number): Skill => ({
  id,
  name: id,
  category,
  tier,
  order,
  since: 2020,
  companyIds: [],
  description: "",
  createdAt: "",
  updatedAt: "",
});

describe("systemRequirements", () => {
  const skills = [
    skill("go", "Language", 4, 2),
    skill("js", "Language", 3, 1),
    skill("docker", "DevOps", 3, 3),
    skill("rust", "Language", 4, 0),
    skill("c", "Language", 4, 4),
  ];

  it("groups by category in first-seen order", () => {
    expect(skillTags(skills)).toEqual(["Language", "DevOps"]);
  });

  it("puts the top-tier skills in minimum and everything in recommended", () => {
    const [lang] = systemRequirements(skills);
    expect(lang.minimum.map((s) => s.id)).toEqual(["rust", "go"]);
    expect(lang.recommended.map((s) => s.id)).toEqual(["rust", "go", "c", "js"]);
  });
});
