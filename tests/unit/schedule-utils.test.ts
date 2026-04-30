import { describe, expect, it } from "vitest";

import { getLessonCompletionAvailableAtLabel, hasLessonEnded } from "@/lib/schedule/utils";

describe("schedule time guards", () => {
  it("allows completion only at or after lesson end time", () => {
    expect(hasLessonEnded("2026-03-28T10:30:00.000Z", new Date("2026-03-28T10:29:59.000Z"))).toBe(false);
    expect(hasLessonEnded("2026-03-28T10:30:00.000Z", new Date("2026-03-28T10:30:00.000Z"))).toBe(true);
  });

  it("formats completion availability helper with end time", () => {
    expect(getLessonCompletionAvailableAtLabel("2026-03-28T11:00:00+03:00")).toBe("после 11:00");
  });
});
