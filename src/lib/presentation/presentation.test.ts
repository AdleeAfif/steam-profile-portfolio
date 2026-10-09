import { describe, expect, it } from "vitest";
import type { Status } from "../api/types";
import { levelRingColour, progressPercent, xpRemaining } from "./level";
import { rarity } from "./rarity";
import { statusExtraLine, statusStyle } from "./status";

describe("levelRingColour", () => {
  it.each([
    [0, "#9b9b9b"],
    [9, "#9b9b9b"],
    [10, "#c02942"],
    [25, "#d95b43"],
    [39, "#fecc23"],
    [40, "#467a3c"],
    [55, "#4e8ddb"],
    [60, "#7652c9"],
    [79, "#c252c9"],
    [80, "#542437"],
    [99, "#997c52"],
    [100, "#9b9b9b"],
    [110, "#c02942"],
    [-3, "#9b9b9b"],
    [Number.NaN, "#9b9b9b"],
  ])("level %s -> %s", (level, colour) => {
    expect(levelRingColour(level)).toBe(colour);
  });
});

describe("level helpers", () => {
  it("computes remaining xp", () => {
    expect(xpRemaining(100, 365)).toBe(265);
    expect(xpRemaining(400, 365)).toBe(0);
  });

  it.each([
    [0, 0],
    [0.5, 50],
    [0.999, 100],
    [1.4, 100],
    [-1, 0],
    [Number.NaN, 0],
  ])("progress %s -> %s%%", (progress, pct) => {
    expect(progressPercent(progress)).toBe(pct);
  });
});

describe("rarity", () => {
  it.each([
    [1, "Consumer Grade", "#b0c3d9", "Familiar"],
    [2, "Industrial Grade", "#5e98d9", "Beginner"],
    [3, "Mil-Spec", "#4b69ff", "Intermediate"],
    [4, "Restricted", "#8847ff", "Proficient"],
    [5, "Classified", "#d32ce6", "Advanced"],
    [6, "Covert", "#eb4b4b", "Expert"],
    [0, "Consumer Grade", "#b0c3d9", "Familiar"],
    [9, "Covert", "#eb4b4b", "Expert"],
  ])("tier %s", (tier, name, colour, proficiency) => {
    expect(rarity(tier)).toMatchObject({ name, colour, proficiency });
  });
});

const base: Status = {
  kind: "available",
  localTime: "2026-10-09T23:30:00+08:00",
  timeZone: "Asia/Kuala_Lumpur",
  currentRole: { title: "Backend Engineer", company: "TM R&D" },
};

describe("status", () => {
  it.each([
    ["available", "Online", "#57cbde"],
    ["working", "In-Game", "#90ba3c"],
    ["sleeping", "Snooze", "#4b8c9b"],
    ["holiday", "Away", "#898989"],
  ] as const)("%s style", (kind, label, colour) => {
    expect(statusStyle(kind)).toEqual({ label, colour });
  });

  it("builds extra lines", () => {
    expect(statusExtraLine(base)).toBe("Open to chat");
    expect(statusExtraLine({ ...base, kind: "working" })).toBe("Currently playing: Backend Engineer @ TM R&D");
    expect(statusExtraLine({ ...base, kind: "working", currentRole: { title: "Engineer", company: "" } })).toBe(
      "Currently playing: Engineer",
    );
    expect(statusExtraLine({ ...base, kind: "sleeping" })).toBe("Local time 23:30");
    expect(statusExtraLine({ ...base, kind: "holiday" })).toBe("On holiday");
    expect(statusExtraLine({ ...base, kind: "holiday", overrideUntil: "2026-10-20T02:00:00Z" })).toBe(
      "On holiday until 20 Oct",
    );
  });
});
