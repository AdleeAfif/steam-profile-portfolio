import { describe, expect, it } from "vitest";
import { pickYear } from "./year";
import { clampPercent, releaseState } from "../wishlist/release";

describe("pickYear", () => {
  const years = [2024, 2023, 2021];

  it("uses a valid requested year", () => {
    expect(pickYear("2023", years)).toBe(2023);
  });

  it("falls back to the newest year for invalid or unknown input", () => {
    expect(pickYear(null, years)).toBe(2024);
    expect(pickYear("abc", years)).toBe(2024);
    expect(pickYear("2022", years)).toBe(2024);
    expect(pickYear("20234", years)).toBe(2024);
  });

  it("returns null without years", () => {
    expect(pickYear("2024", [])).toBeNull();
  });
});

describe("releaseState", () => {
  const now = new Date(2026, 9, 9);

  it("compares the target month with now", () => {
    expect(releaseState("2027-06", 10, now)).toBe("coming-soon");
    expect(releaseState("2026-10", 10, now)).toBe("this-month");
    expect(releaseState("2026-09", 10, now)).toBe("overdue");
  });

  it("treats full progress as released", () => {
    expect(releaseState("2020-01", 100, now)).toBe("released");
  });

  it("clamps percent", () => {
    expect(clampPercent(140)).toBe(100);
    expect(clampPercent(-3)).toBe(0);
    expect(clampPercent(Number.NaN)).toBe(0);
    expect(clampPercent(42.4)).toBe(42);
  });
});
