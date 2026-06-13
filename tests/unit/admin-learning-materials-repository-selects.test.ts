import { describe, expect, it } from "vitest";

import { TEST_BASE_SELECT, TEST_DETAIL_SELECT } from "@/lib/admin/tests.repository";
import { WORD_CARD_SET_BASE_SELECT, WORD_CARD_SET_DETAIL_SELECT } from "@/lib/admin/word-card-sets";

describe("admin learning material repository selects", () => {
  it("uses explicit test material field lists", () => {
    expect(TEST_BASE_SELECT).toContain("id");
    expect(TEST_BASE_SELECT).toContain("title");
    expect(TEST_BASE_SELECT).toContain("scoring_profile");
    expect(TEST_BASE_SELECT).not.toContain("*");
    expect(TEST_DETAIL_SELECT).toContain(TEST_BASE_SELECT);
    expect(TEST_DETAIL_SELECT).toContain("test_questions(");
    expect(TEST_DETAIL_SELECT).not.toContain("*");
  });

  it("uses explicit word card set field lists", () => {
    expect(WORD_CARD_SET_BASE_SELECT).toContain("id");
    expect(WORD_CARD_SET_BASE_SELECT).toContain("topic_slug");
    expect(WORD_CARD_SET_BASE_SELECT).toContain("updated_at");
    expect(WORD_CARD_SET_BASE_SELECT).not.toContain("*");
    expect(WORD_CARD_SET_DETAIL_SELECT).toContain(WORD_CARD_SET_BASE_SELECT);
    expect(WORD_CARD_SET_DETAIL_SELECT).toContain("word_card_items(");
    expect(WORD_CARD_SET_DETAIL_SELECT).not.toContain("*");
  });
});
