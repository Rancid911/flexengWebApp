import { describe, expect, it } from "vitest";

import { formatRuDayMonth, formatRuDayMonthWeekday, formatRuLongDate, formatRuLongDateTime, formatRuShortDate, formatRuShortDateTime, formatRuTime, getMoscowDayKey } from "@/lib/dates/format-ru-date";

describe("formatRuLongDate", () => {
  it("formats dates deterministically in the moscow timezone", () => {
    expect(formatRuLongDate("2026-03-15T18:45:00.000Z")).toBe("15 марта 2026 г.");
  });

  it("returns an empty string for empty or invalid values", () => {
    expect(formatRuLongDate(null)).toBe("");
    expect(formatRuLongDate(undefined)).toBe("");
    expect(formatRuLongDate("not-a-date")).toBe("");
  });
});

describe("formatRuDayMonth", () => {
  it("formats short dates deterministically in the moscow timezone", () => {
    expect(formatRuDayMonth("2026-03-15T18:45:00.000Z")).toBe("15 марта");
  });
});

describe("formatRuLongDateTime", () => {
  it("formats date and time in the moscow timezone", () => {
    expect(formatRuLongDateTime("2026-03-15T18:45:00.000Z")).toBe("15 марта в 21:45");
  });

  it("returns an empty string for invalid values", () => {
    expect(formatRuLongDateTime("not-a-date")).toBe("");
  });
});

describe("additional deterministic ru date helpers", () => {
  it("formats time and short date in the moscow timezone", () => {
    expect(formatRuTime("2026-03-15T18:45:00.000Z")).toBe("21:45");
    expect(formatRuShortDate("2026-03-15T18:45:00.000Z")).toBe("15.03.2026");
    expect(formatRuShortDateTime("2026-04-18T18:45:00.000Z")).toBe("18.04.2026, 21:45");
  });

  it("returns an empty string for invalid short date time values", () => {
    expect(formatRuShortDateTime(null)).toBe("");
    expect(formatRuShortDateTime(undefined)).toBe("");
    expect(formatRuShortDateTime("not-a-date")).toBe("");
  });

  it("formats weekday labels and moscow day keys", () => {
    expect(formatRuDayMonthWeekday("2026-03-15T18:45:00.000Z")).toBe("воскресенье, 15 марта");
    expect(getMoscowDayKey("2026-03-15T18:45:00.000Z")).toBe("2026-03-15");
  });
});
