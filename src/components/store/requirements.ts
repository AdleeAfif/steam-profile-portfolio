import type { Skill, SkillCategory } from "../../lib/api/types";

export interface RequirementRow {
  category: SkillCategory;
  minimum: Skill[];
  recommended: Skill[];
}

const byStrength = (a: Skill, b: Skill) => b.tier - a.tier || (a.order ?? 0) - (b.order ?? 0);

export function systemRequirements(skills: readonly Skill[]): RequirementRow[] {
  const groups = new Map<SkillCategory, Skill[]>();
  for (const skill of [...skills].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))) {
    groups.set(skill.category, [...(groups.get(skill.category) ?? []), skill]);
  }
  return [...groups].map(([category, list]) => {
    const sorted = [...list].sort(byStrength);
    const topTier = sorted[0].tier;
    const minimum = sorted.filter((s) => s.tier === topTier).slice(0, 2);
    return { category, minimum, recommended: sorted };
  });
}

export const skillTags = (skills: readonly Skill[]): SkillCategory[] => systemRequirements(skills).map((r) => r.category);
