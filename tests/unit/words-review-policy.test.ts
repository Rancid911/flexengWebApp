import { describe, expect, it } from "vitest";

import {
  aggregateWordSessionAnswers,
  buildWordReviewUpdate,
  filterWordSessionCards,
  isWordDueForReview,
  sortWordCardsForSession
} from "@/lib/words/words-review.policy";
import type { StudentWordRow, WordCard } from "@/lib/words/words.types";

function makeCard(overrides: Partial<WordCard>): WordCard {
  return {
    id: "word-1",
    progressId: "word-1",
    catalogId: null,
    term: "word",
    translation: "слово",
    example: "A word.",
    exampleTranslation: "Слово.",
    topicSlug: "general",
    topicTitle: "Общее",
    setSlug: null,
    setTitle: null,
    status: "learning",
    nextReviewAt: null,
    ...overrides
  };
}

function makeRow(overrides: Partial<StudentWordRow> = {}): StudentWordRow {
  return {
    id: "word-1",
    term: "word",
    translation: "слово",
    status: "learning",
    next_review_at: null,
    created_at: "2026-06-01T00:00:00.000Z",
    ...overrides
  };
}

describe("words review policy", () => {
  it("excludes new and mastered words from due review and respects timestamps", () => {
    const now = new Date("2026-06-12T12:00:00.000Z");

    expect(
      isWordDueForReview(
        { status: "learning", nextReviewAt: "2026-06-12T11:00:00.000Z" },
        now
      )
    ).toBe(true);
    expect(
      isWordDueForReview(
        { status: "review", nextReviewAt: "2026-06-12T13:00:00.000Z" },
        now
      )
    ).toBe(false);
    expect(
      isWordDueForReview({ status: "new", nextReviewAt: null }, now)
    ).toBe(false);
    expect(
      isWordDueForReview({ status: "mastered", nextReviewAt: null }, now)
    ).toBe(false);
  });

  it("builds default sessions from all due cards and the first five new cards", () => {
    const due = makeCard({
      id: "due",
      nextReviewAt: "2020-01-01T00:00:00.000Z"
    });
    const newCards = Array.from({ length: 7 }, (_, index) =>
      makeCard({
        id: `new-${index}`,
        term: `new-${index}`,
        status: "new",
        nextReviewAt: null
      })
    );

    const filtered = filterWordSessionCards([due, ...newCards], {
      mode: "default",
      limit: 10
    });

    expect(filtered.map((card) => card.id)).toEqual([
      "due",
      "new-0",
      "new-1",
      "new-2",
      "new-3",
      "new-4"
    ]);
    expect(sortWordCardsForSession(filtered)[0]?.id).toBe("new-0");
  });

  it("filters topic, set, new, review, and difficult modes", () => {
    const cards = [
      makeCard({
        id: "new",
        status: "new",
        topicSlug: "food",
        setSlug: "set-1"
      }),
      makeCard({
        id: "review",
        status: "review",
        nextReviewAt: "2020-01-01T00:00:00.000Z",
        topicSlug: "food",
        setSlug: "set-1"
      }),
      makeCard({
        id: "difficult",
        status: "difficult",
        topicSlug: "travel",
        setSlug: "set-2"
      })
    ];

    expect(
      filterWordSessionCards(cards, {
        mode: "new",
        topicSlug: "food",
        setSlug: "set-1",
        limit: 5
      }).map((card) => card.id)
    ).toEqual(["new"]);
    expect(
      filterWordSessionCards(cards, { mode: "review", limit: 5 }).map(
        (card) => card.id
      )
    ).toEqual(["review", "difficult"]);
    expect(
      filterWordSessionCards(cards, { mode: "difficult", limit: 5 }).map(
        (card) => card.id
      )
    ).toEqual(["difficult"]);
  });

  it("aggregates duplicate answers with unknown then hard priority", () => {
    expect(
      aggregateWordSessionAnswers([
        { wordId: "word-1", result: "known" },
        { wordId: "word-1", result: "hard", markedDifficult: true },
        { wordId: "word-1", result: "unknown" },
        { wordId: "word-2", result: "known" }
      ])
    ).toEqual([
      {
        wordId: "word-1",
        result: "unknown",
        markedDifficult: true
      },
      { wordId: "word-2", result: "known" }
    ]);
  });

  it("applies unknown, hard, marked-difficult, known, and mastery transitions", () => {
    const baseDate = new Date("2026-06-12T12:00:00.000Z");

    expect(
      buildWordReviewUpdate(
        makeRow({ review_count: 2, unknown_count: 1 }),
        { wordId: "word-1", result: "unknown" },
        baseDate
      )
    ).toMatchObject({
      status: "difficult",
      next_review_at: "2026-06-12T16:00:00.000Z",
      interval_days: 0,
      review_count: 3,
      known_streak: 0,
      unknown_count: 2,
      addedDifficult: true,
      mastered: false
    });
    expect(
      buildWordReviewUpdate(
        makeRow(),
        { wordId: "word-1", result: "hard" },
        baseDate
      )
    ).toMatchObject({
      status: "learning",
      next_review_at: "2026-06-13T12:00:00.000Z",
      interval_days: 1,
      hard_count: 1
    });
    expect(
      buildWordReviewUpdate(
        makeRow(),
        { wordId: "word-1", result: "known", markedDifficult: true },
        baseDate
      )
    ).toMatchObject({
      status: "difficult",
      next_review_at: "2026-06-13T00:00:00.000Z",
      addedDifficult: true
    });
    expect(
      buildWordReviewUpdate(
        makeRow({ interval_days: 2, known_streak: 1 }),
        { wordId: "word-1", result: "known" },
        baseDate
      )
    ).toMatchObject({
      status: "learning",
      interval_days: 4,
      known_streak: 2,
      mastered: false
    });
    expect(
      buildWordReviewUpdate(
        makeRow({ interval_days: 4, known_streak: 2 }),
        { wordId: "word-1", result: "known" },
        baseDate
      )
    ).toMatchObject({
      status: "mastered",
      next_review_at: "2026-07-12T12:00:00.000Z",
      interval_days: 30,
      known_streak: 3,
      mastered: true
    });
  });
});

