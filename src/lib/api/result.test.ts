import { describe, expect, it } from "vitest";
import { parseRetryAfter, waitPhrase } from "./result";

describe("parseRetryAfter", () => {
  const now = Date.parse("2026-10-10T08:00:00Z");

  it.each([
    [null, undefined],
    ["", undefined],
    ["0", undefined],
    ["120", 120],
    [" 30 ", 30],
    ["-5", undefined],
    ["soon", undefined],
    ["Sat, 10 Oct 2026 08:01:30 GMT", 90],
    ["Sat, 10 Oct 2026 07:59:00 GMT", undefined],
  ])("%s -> %s", (value, expected) => {
    expect(parseRetryAfter(value, now)).toBe(expected);
  });
});

describe("waitPhrase", () => {
  it.each([
    [undefined, "in a little while"],
    [1, "in 1 second"],
    [45, "in 45 seconds"],
    [60, "in about 1 minute"],
    [61, "in about 2 minutes"],
    [3600, "in about 60 minutes"],
  ])("%s -> %s", (seconds, phrase) => {
    expect(waitPhrase(seconds)).toBe(phrase);
  });
});
