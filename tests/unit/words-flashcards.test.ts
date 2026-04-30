import { describe, expect, it } from "vitest";

import { buildCardsFromDbCatalog, buildWordsOverviewSummary, mapPublishedWordCardSetRowsToCatalog, type DbCatalogWord } from "@/lib/words/queries";
import { wordSessionCompleteSchema, wordSessionParamsSchema } from "@/lib/words/validation";

const dbCatalog: DbCatalogWord[] = [
  {
    id: "db:card-1",
    topicSlug: "food",
    topicTitle: "Еда",
    setSlug: "db:set-food-cafe",
    setTitle: "Кафе и ресторан",
    setDescription: "Заказ, меню, счет и разговор с официантом.",
    term: "menu",
    translation: "меню",
    example: "Could we see the menu, please?",
    exampleTranslation: "Можно нам посмотреть меню, пожалуйста?",
    cefrLevel: "A1"
  },
  {
    id: "db:card-2",
    topicSlug: "food",
    topicTitle: "Еда",
    setSlug: "db:set-food-cafe",
    setTitle: "Кафе и ресторан",
    setDescription: "Заказ, меню, счет и разговор с официантом.",
    term: "order",
    translation: "заказывать",
    example: "I would like to order a salad.",
    exampleTranslation: "Я хотел бы заказать салат.",
    cefrLevel: "A1"
  }
];

describe("words DB catalog cards", () => {
  it("builds new flashcards from published DB catalog rows", () => {
    expect(buildCardsFromDbCatalog([], dbCatalog)).toEqual([
      expect.objectContaining({
        id: "catalog:db:card-1",
        catalogId: "db:card-1",
        term: "menu",
        topicSlug: "food",
        setSlug: "db:set-food-cafe",
        cefrLevel: "A1",
        status: "new"
      }),
      expect.objectContaining({
        id: "catalog:db:card-2",
        catalogId: "db:card-2",
        term: "order",
        status: "new"
      })
    ]);
  });

  it("does not match old hardcoded catalog slugs to DB catalog cards", () => {
    const cards = buildCardsFromDbCatalog(
      [
        {
          id: "progress-1",
          term: "menu",
          translation: "меню",
          status: "learning",
          next_review_at: null,
          catalog_slug: "food-cafe-menu",
          created_at: "2026-04-24T00:00:00.000Z"
        }
      ],
      dbCatalog
    );

    expect(cards).toEqual([
      expect.objectContaining({ id: "progress-1", catalogId: "food-cafe-menu", status: "learning" }),
      expect.objectContaining({ id: "catalog:db:card-1", catalogId: "db:card-1", status: "new" }),
      expect.objectContaining({ id: "catalog:db:card-2", catalogId: "db:card-2", status: "new" })
    ]);
  });

  it("does not create starter cards when the DB catalog is empty", () => {
    expect(buildCardsFromDbCatalog([], [])).toEqual([]);
  });

  it("does not add a duplicate new card when DB catalog progress already exists", () => {
    const cards = buildCardsFromDbCatalog(
      [
        {
          id: "progress-1",
          term: "menu",
          translation: "меню",
          status: "learning",
          next_review_at: null,
          catalog_slug: "db:card-1",
          created_at: "2026-04-24T00:00:00.000Z"
        }
      ],
      dbCatalog
    );

    expect(cards).toEqual([
      expect.objectContaining({ id: "progress-1", catalogId: "db:card-1", status: "learning" }),
      expect.objectContaining({ id: "catalog:db:card-2", catalogId: "db:card-2", status: "new" })
    ]);
  });

  it("maps published DB set rows and ignores unpublished sets", () => {
    expect(
      mapPublishedWordCardSetRowsToCatalog([
        {
          id: "set-food-cafe",
          title: "Кафе и ресторан",
          description: "Заказ, меню, счет и разговор с официантом.",
          topic_slug: "food",
          topic_title: "Еда",
          cefr_level: "A1",
          is_published: true,
          sort_order: 0,
          word_card_items: [
            {
              id: "card-1",
              term: "menu",
              translation: "меню",
              example_sentence: "Could we see the menu, please?",
              example_translation: "Можно нам посмотреть меню, пожалуйста?",
              sort_order: 0
            }
          ]
        },
        {
          id: "set-draft",
          title: "Draft",
          description: null,
          topic_slug: "food",
          topic_title: "Еда",
          cefr_level: "A1",
          is_published: false,
          sort_order: 1,
          word_card_items: [
            {
              id: "draft-card",
              term: "draft",
              translation: "черновик",
              example_sentence: "Draft example.",
              example_translation: "Черновой пример.",
              sort_order: 0
            }
          ]
        }
      ])
    ).toEqual([
      expect.objectContaining({
        id: "db:card-1",
        setSlug: "db:set-food-cafe",
        setTitle: "Кафе и ресторан",
        term: "menu"
      })
    ]);
  });
});

describe("words flashcards validation", () => {
  it("accepts session filters for the supported modes and limits", () => {
    expect(wordSessionParamsSchema.parse({ mode: "difficult", topicSlug: "travel", setSlug: "travel-airport", limit: "10" })).toEqual({
      mode: "difficult",
      topicSlug: "travel",
      setSlug: "travel-airport",
      limit: 10
    });
    expect(wordSessionParamsSchema.safeParse({ mode: "new", limit: "7" }).success).toBe(false);
  });

  it("accepts known, hard and unknown answer payloads", () => {
    expect(
      wordSessionCompleteSchema.parse({
        answers: [
          { wordId: "catalog:db:card-1", result: "known" },
          { wordId: "word-1", result: "hard", markedDifficult: true },
          { wordId: "word-2", result: "unknown" }
        ]
      }).answers
    ).toHaveLength(3);
  });
});

describe("words overview summary", () => {
  it("counts difficult, active, mastered and due-review buckets", () => {
    const summary = buildWordsOverviewSummary({
      words: [{ status: "new" }, { status: "learning" }, { status: "difficult" }, { status: "mastered" }, { status: "review" }],
      reviewWords: [{ id: "learning" }, { id: "review" }],
      newWords: [{ id: "new" }]
    });

    expect(summary).toMatchObject({
      totalWords: 5,
      reviewCount: 2,
      newCount: 1,
      activeCount: 4,
      difficultCount: 1,
      masteredCount: 1
    });
  });
});
