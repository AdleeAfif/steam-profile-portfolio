import type { Company, Project, Skill, SkillCategory } from "../../lib/api/types";

export const ALL_TAB = "all";

export const CATEGORIES: readonly SkillCategory[] = [
  "Language",
  "Framework",
  "Database",
  "Messaging",
  "DevOps",
  "Cloud",
  "Tooling",
];

export interface InventoryLink {
  id: string;
  name: string;
}

export interface InventoryCompany extends InventoryLink {
  color: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  icon?: string;
  iconColor?: string;
  tier: number;
  category: SkillCategory;
  description: string;
  since: number;
  companyIds: string[];
  years: number;
  yearsLabel: string;
  companies: InventoryCompany[];
  projects: InventoryLink[];
}

export interface InventoryTab {
  id: string;
  name: string;
  count: number;
}

export interface InventoryState {
  tab: string;
  item: string | null;
}

export interface InventoryFilter {
  tab: string;
  query: string;
  category: SkillCategory | "";
}

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;

export function yearsUsed(since: number, currentYear: number): number {
  if (!Number.isFinite(since)) return 1;
  return Math.max(1, currentYear - since);
}

export function yearsLabel(years: number): string {
  return `${years} year${years === 1 ? "" : "s"}`;
}

export function buildItems(
  skills: readonly Skill[],
  companies: readonly Company[],
  projects: readonly Project[],
  currentYear: number,
): InventoryItem[] {
  const companyById = new Map(companies.map((c) => [c.id, c]));
  const sortedProjects = [...projects].sort(byOrder);

  return [...skills].sort(byOrder).map((skill) => {
    const id = skill.id.toLowerCase();
    const years = yearsUsed(skill.since, currentYear);
    return {
      id: skill.id,
      name: skill.name,
      icon: skill.icon || undefined,
      iconColor: skill.iconColor || undefined,
      tier: skill.tier,
      category: skill.category,
      description: skill.description,
      since: skill.since,
      companyIds: skill.companyIds,
      years,
      yearsLabel: yearsLabel(years),
      companies: skill.companyIds
        .map((cid) => companyById.get(cid))
        .filter((c): c is Company => c !== undefined)
        .sort(byOrder)
        .map((c) => ({ id: c.id, name: c.name, color: c.color })),
      projects: sortedProjects
        .filter((p) => p.tags.some((tag) => tag.toLowerCase() === id))
        .map((p) => ({ id: p.id, name: p.name })),
    };
  });
}

export function buildTabs(items: readonly InventoryItem[], companies: readonly Company[]): InventoryTab[] {
  return [
    { id: ALL_TAB, name: "All", count: items.length },
    ...[...companies].sort(byOrder).map((c) => ({
      id: c.id,
      name: c.name,
      count: items.filter((item) => item.companyIds.includes(c.id)).length,
    })),
  ];
}

export function filterItems(items: readonly InventoryItem[], filter: InventoryFilter): InventoryItem[] {
  const query = filter.query.trim().toLowerCase();
  return items.filter(
    (item) =>
      (filter.tab === ALL_TAB || item.companyIds.includes(filter.tab)) &&
      (!filter.category || item.category === filter.category) &&
      (!query || item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)),
  );
}

export function parseState(
  params: URLSearchParams,
  tabs: readonly InventoryTab[],
  items: readonly InventoryItem[],
): InventoryState {
  const tab = params.get("tab");
  const item = params.get("item");
  return {
    tab: tab && tabs.some((t) => t.id === tab) ? tab : ALL_TAB,
    item: item && items.some((i) => i.id === item) ? item : null,
  };
}

export function stateSearch(state: InventoryState): string {
  const params = new URLSearchParams();
  if (state.tab !== ALL_TAB) params.set("tab", state.tab);
  if (state.item) params.set("item", state.item);
  const search = params.toString();
  return search ? `?${search}` : "";
}

function luminance(hex: string): number {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Tiles are near-black, so very dark brand colours would be invisible.
export function iconUrl(icon: string, iconColor?: string): string {
  const base = `https://cdn.simpleicons.org/${encodeURIComponent(icon)}`;
  if (!iconColor || !/^[0-9a-f]{6}$/i.test(iconColor)) return base;
  return `${base}/${luminance(iconColor) < 0.05 ? "c7d5e0" : iconColor}`;
}

export function initials(name: string): string {
  const words = name.split(/[\s.\-_/]+/).filter(Boolean);
  if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
