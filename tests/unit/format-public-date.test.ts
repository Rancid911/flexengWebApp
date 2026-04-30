import { describe, expect, it } from "vitest";

import { formatPublicDate } from "@/lib/dates/format-public-date";

describe("formatPublicDate", () => {
  it("formats an iso date deterministically for public ui", () => {
    expect(formatPublicDate("2026-03-15T18:45:00.000Z")).toBe("15 марта 2026 г.");
  });

  it("returns an empty string for empty or invalid values", () => {
    expect(formatPublicDate(null)).toBe("");
    expect(formatPublicDate(undefined)).toBe("");
    expect(formatPublicDate("not-a-date")).toBe("");
  });
});
