import { describe, expect, it } from "vitest";
import { utcToZonedLocal, zonedLocalToUtc } from "./time";

describe("zonedLocalToUtc", () => {
  it.each([
    ["2026-10-10T09:30", "Asia/Kuala_Lumpur", "2026-10-10T01:30:00Z"],
    ["2026-01-01T00:00", "UTC", "2026-01-01T00:00:00Z"],
    ["2026-07-01T12:00", "America/New_York", "2026-07-01T16:00:00Z"],
    ["2026-12-01T12:00", "America/New_York", "2026-12-01T17:00:00Z"],
    ["2026-10-10T09:30", "Not/AZone", "2026-10-10T09:30:00Z"],
  ])("%s in %s", (local, tz, want) => {
    expect(zonedLocalToUtc(local, tz)).toBe(want);
  });

  it("rejects malformed input", () => {
    expect(zonedLocalToUtc("tomorrow", "UTC")).toBeNull();
    expect(zonedLocalToUtc("", "UTC")).toBeNull();
  });
});

describe("utcToZonedLocal", () => {
  it("round-trips", () => {
    expect(utcToZonedLocal("2026-10-10T01:30:00Z", "Asia/Kuala_Lumpur")).toBe("2026-10-10T09:30");
    expect(utcToZonedLocal("bad", "UTC")).toBe("");
  });
});
