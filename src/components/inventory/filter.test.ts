import { describe, expect, it } from "vitest";
import type { Company, Project, Skill } from "../../lib/api/types";
import {
  ALL_TAB,
  buildItems,
  buildTabs,
  filterItems,
  iconUrl,
  initials,
  parseState,
  stateSearch,
  yearsLabel,
  yearsUsed,
} from "./filter";

const skill = (s: Partial<Skill> & Pick<Skill, "id" | "name">): Skill =>
  ({ tier: 3, category: "Language", since: 2020, companyIds: [], description: "", order: 0, ...s }) as Skill;

const company = (c: Partial<Company> & Pick<Company, "id" | "name" | "order">): Company =>
  ({ role: "", kind: "work", start: "2020-01", color: "#fff", ...c }) as Company;

const project = (p: Partial<Project> & Pick<Project, "id" | "name" | "tags">): Project =>
  ({ order: 0, ...p }) as Project;

const skills = [
  skill({ id: "go", name: "Go", order: 1, since: 2023, companyIds: ["b", "a"], description: "Backend services" }),
  skill({ id: "redis", name: "Redis", order: 2, category: "Database", since: 2026, companyIds: ["a"] }),
  skill({ id: "git", name: "Git", order: 0, category: "Tooling", since: 2019, companyIds: ["ghost"] }),
];
const companies = [company({ id: "a", name: "Alpha", order: 1 }), company({ id: "b", name: "Beta", order: 0 })];
const projects = [
  project({ id: "p2", name: "Second", tags: ["GO"], order: 1 }),
  project({ id: "p1", name: "First", tags: ["go", "redis"], order: 0 }),
];

describe("years", () => {
  it("is at least one year", () => {
    expect(yearsUsed(2023, 2026)).toBe(3);
    expect(yearsUsed(2026, 2026)).toBe(1);
    expect(yearsUsed(2030, 2026)).toBe(1);
  });

  it("pluralises the label", () => {
    expect(yearsLabel(1)).toBe("1 year");
    expect(yearsLabel(3)).toBe("3 years");
  });
});

describe("buildItems", () => {
  const items = buildItems(skills, companies, projects, 2026);

  it("sorts by order and resolves companies and projects", () => {
    expect(items.map((i) => i.id)).toEqual(["git", "go", "redis"]);
    const go = items[1];
    expect(go.yearsLabel).toBe("3 years");
    expect(go.companies.map((c) => c.name)).toEqual(["Beta", "Alpha"]);
    expect(go.projects).toEqual([
      { id: "p1", name: "First" },
      { id: "p2", name: "Second" },
    ]);
  });

  it("drops unknown companies", () => {
    expect(items[0].companies).toEqual([]);
  });
});

describe("tabs and filtering", () => {
  const items = buildItems(skills, companies, projects, 2026);
  const tabs = buildTabs(items, companies);

  it("builds All plus one tab per company in order", () => {
    expect(tabs).toEqual([
      { id: ALL_TAB, name: "All", count: 3 },
      { id: "b", name: "Beta", count: 1 },
      { id: "a", name: "Alpha", count: 2 },
    ]);
  });

  it("filters by tab, category and query", () => {
    const ids = (f: Parameters<typeof filterItems>[1]) => filterItems(items, f).map((i) => i.id);
    expect(ids({ tab: ALL_TAB, query: "", category: "" })).toEqual(["git", "go", "redis"]);
    expect(ids({ tab: "a", query: "", category: "" })).toEqual(["go", "redis"]);
    expect(ids({ tab: "a", query: "", category: "Database" })).toEqual(["redis"]);
    expect(ids({ tab: ALL_TAB, query: " BACKEND ", category: "" })).toEqual(["go"]);
    expect(ids({ tab: "b", query: "redis", category: "" })).toEqual([]);
  });

  it("parses and serialises URL state", () => {
    expect(parseState(new URLSearchParams("tab=a&item=go"), tabs, items)).toEqual({ tab: "a", item: "go" });
    expect(parseState(new URLSearchParams("tab=nope&item=nope"), tabs, items)).toEqual({ tab: ALL_TAB, item: null });
    expect(stateSearch({ tab: ALL_TAB, item: null })).toBe("");
    expect(stateSearch({ tab: ALL_TAB, item: "go" })).toBe("?item=go");
    expect(stateSearch({ tab: "a", item: "go" })).toBe("?tab=a&item=go");
  });
});

describe("icons", () => {
  it("builds simpleicons URLs and lightens dark colours", () => {
    expect(iconUrl("go")).toBe("https://cdn.simpleicons.org/go");
    expect(iconUrl("go", "00ADD8")).toBe("https://cdn.simpleicons.org/go/00ADD8");
    expect(iconUrl("express", "000000")).toBe("https://cdn.simpleicons.org/express/c7d5e0");
    expect(iconUrl("go", "bad")).toBe("https://cdn.simpleicons.org/go");
  });

  it("makes initials", () => {
    expect(initials("Node.js")).toBe("NJ");
    expect(initials("Go")).toBe("GO");
    expect(initials("Tailwind CSS")).toBe("TC");
  });
});
