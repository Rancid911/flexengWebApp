import { describe, expect, it } from "vitest";

import { dateToIsoWithCurrentTime, isoToDateOnly } from "@/lib/date-utils";

describe("lib/date-utils", () => {
  it("converts date-only to ISO with current time", () => {
    const result = dateToIsoWithCurrentTime("2026-03-23");
    expect(result).toBeTruthy();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result?.endsWith("Z")).toBe(true);
  });

  it("returns null for invalid date input", () => {
    expect(dateToIsoWithCurrentTime("")).toBeNull();
    expect(dateToIsoWithCurrentTime("bad-value")).toBeNull();
  });

  it("extracts YYYY-MM-DD from iso", () => {
    expect(isoToDateOnly("2026-03-23T12:10:00.000Z")).toBe("2026-03-23");
    expect(isoToDateOnly("bad")).toBe("");
  });
});
