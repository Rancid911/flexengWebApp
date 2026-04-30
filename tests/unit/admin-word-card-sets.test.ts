import { describe, expect, it } from "vitest";

import { adminWordCardSetCreateSchema } from "@/lib/admin/validation";

const cards = Array.from({ length: 5 }, (_, index) => ({
  term: `word ${index + 1}`,
  translation: `слово ${index + 1}`,
  example_sentence: `Example sentence ${index + 1}.`,
  example_translation: `Пример ${index + 1}.`,
  sort_order: index
}));

describe("admin word card set validation", () => {
  it("requires CEFR for card sets", () => {
    const parsed = adminWordCardSetCreateSchema.safeParse({
      title: "Cafe words",
      topic_slug: "food",
      topic_title: "Еда",
      is_published: false,
      cards
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.cefr_level).toBeTruthy();
    }
  });

  it("rejects unsupported CEFR values", () => {
    const parsed = adminWordCardSetCreateSchema.safeParse({
      title: "Cafe words",
      topic_slug: "food",
      topic_title: "Еда",
      cefr_level: "C2",
      is_published: false,
      cards
    });

    expect(parsed.success).toBe(false);
  });

  it("requires at least five cards before publishing", () => {
    const parsed = adminWordCardSetCreateSchema.safeParse({
      title: "Cafe words",
      topic_slug: "food",
      topic_title: "Еда",
      cefr_level: "A1",
      is_published: true,
      cards: cards.slice(0, 4)
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.cards).toContain("published word card set requires at least 5 cards");
    }
  });
});
