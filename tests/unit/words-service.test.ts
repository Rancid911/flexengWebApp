import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentStudentProfileMock = vi.fn();
const getCurrentRealStudentWriteContextMock = vi.fn();
const createUserScopedWordsRepositoryMock = vi.fn();

const repository = {
  loadPublishedWordCardSets: vi.fn(),
  loadStudentWords: vi.fn(),
  loadPublishedCatalogItems: vi.fn(),
  loadStudentWordsByIds: vi.fn(),
  loadStudentWordsByCatalogSlugs: vi.fn(),
  updateStudentWord: vi.fn(),
  insertStudentWord: vi.fn(),
  insertWordReview: vi.fn()
};

vi.mock("@/lib/students/current-student", () => ({
  getCurrentStudentProfile: () => getCurrentStudentProfileMock(),
  getCurrentRealStudentWriteContext: (...args: unknown[]) =>
    getCurrentRealStudentWriteContextMock(...args)
}));

vi.mock("@/lib/words/words.repository", () => ({
  createUserScopedWordsRepository: () =>
    createUserScopedWordsRepositoryMock()
}));

vi.mock("@/lib/server/timing", () => ({
  measureServerTiming: (_label: string, operation: () => unknown) =>
    operation()
}));

describe("words service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createUserScopedWordsRepositoryMock.mockResolvedValue(repository);
    repository.loadPublishedWordCardSets.mockResolvedValue({
      data: [],
      error: null
    });
    repository.loadStudentWords.mockResolvedValue({ data: [], error: null });
    repository.loadPublishedCatalogItems.mockResolvedValue({
      data: [],
      error: null
    });
    repository.loadStudentWordsByIds.mockResolvedValue({
      data: [],
      error: null
    });
    repository.loadStudentWordsByCatalogSlugs.mockResolvedValue({
      data: [],
      error: null
    });
    repository.updateStudentWord.mockResolvedValue({
      data: null,
      error: null
    });
    repository.insertStudentWord.mockResolvedValue({
      data: { id: "inserted-word" },
      error: null
    });
    repository.insertWordReview.mockResolvedValue({
      data: null,
      error: null
    });
  });

  it("returns the existing empty fallbacks without creating a repository", async () => {
    getCurrentStudentProfileMock.mockResolvedValue(null);
    const { getStudentWords, getWordsOverviewSummary } = await import(
      "@/lib/words/words.service"
    );

    await expect(getStudentWords()).resolves.toEqual([]);
    await expect(getWordsOverviewSummary()).resolves.toEqual({
      totalWords: 0,
      reviewCount: 0,
      newCount: 0,
      activeCount: 0,
      difficultCount: 0,
      masteredCount: 0
    });
    expect(createUserScopedWordsRepositoryMock).not.toHaveBeenCalled();
  });

  it("merges student progress with the published catalog and keeps catalog mapping", async () => {
    getCurrentStudentProfileMock.mockResolvedValue({
      studentId: "student-1"
    });
    repository.loadStudentWords.mockResolvedValue({
      data: [
        {
          id: "progress-1",
          term: "menu",
          translation: "меню",
          status: "learning",
          next_review_at: null,
          catalog_slug: "db:card-1",
          created_at: "2026-06-01T00:00:00.000Z"
        }
      ],
      error: null
    });
    repository.loadPublishedWordCardSets.mockResolvedValue({
      data: [
        {
          id: "set-1",
          title: "Кафе",
          description: "Ресторанная лексика",
          topic_slug: "food",
          topic_title: "Еда",
          cefr_level: "A1",
          sort_order: 0,
          word_card_items: [
            {
              id: "card-1",
              term: "menu",
              translation: "меню",
              example_sentence: "A menu.",
              example_translation: "Меню.",
              sort_order: 0
            },
            {
              id: "card-2",
              term: "order",
              translation: "заказывать",
              example_sentence: "Order food.",
              example_translation: "Заказать еду.",
              sort_order: 1
            }
          ]
        }
      ],
      error: null
    });
    const { getStudentWords } = await import("@/lib/words/words.service");

    await expect(getStudentWords()).resolves.toEqual([
      expect.objectContaining({
        id: "progress-1",
        catalogId: "db:card-1",
        status: "learning",
        setSlug: "db:set-1"
      }),
      expect.objectContaining({
        id: "catalog:db:card-2",
        catalogId: "db:card-2",
        status: "new"
      })
    ]);
    expect(repository.loadStudentWords).toHaveBeenCalledWith("student-1");
    expect(repository.loadPublishedWordCardSets).toHaveBeenCalledTimes(1);
  });

  it("keeps list loader repository errors as soft empty results", async () => {
    getCurrentStudentProfileMock.mockResolvedValue({
      studentId: "student-errors"
    });
    repository.loadStudentWords.mockResolvedValue({
      data: null,
      error: { message: "student words failed" }
    });
    repository.loadPublishedWordCardSets.mockResolvedValue({
      data: null,
      error: { message: "catalog failed" }
    });
    const { getStudentWords } = await import("@/lib/words/words.service");

    await expect(getStudentWords()).resolves.toEqual([]);
  });

  it("updates existing progress, inserts catalog progress, and ignores review-history errors", async () => {
    getCurrentRealStudentWriteContextMock.mockResolvedValue({
      studentId: "student-1"
    });
    repository.loadStudentWordsByIds.mockResolvedValue({
      data: [
        {
          id: "word-1",
          term: "known",
          translation: "известный",
          status: "learning",
          next_review_at: null,
          known_streak: 2,
          created_at: "2026-06-01T00:00:00.000Z"
        }
      ],
      error: null
    });
    repository.loadPublishedCatalogItems.mockResolvedValue({
      data: [
        {
          id: "card-1",
          term: "menu",
          translation: "меню",
          example_sentence: "A menu.",
          example_translation: "Меню.",
          word_card_sets: {
            id: "set-1",
            title: "Кафе",
            description: null,
            topic_slug: "food",
            topic_title: "Еда",
            cefr_level: "A1",
            is_published: true
          }
        }
      ],
      error: null
    });
    repository.insertWordReview.mockResolvedValue({
      data: null,
      error: { message: "history failed" }
    });
    const { completeWordSession } = await import(
      "@/lib/words/words.service"
    );

    const result = await completeWordSession([
      { wordId: "word-1", result: "known" },
      { wordId: "catalog:db:card-1", result: "unknown" }
    ]);

    expect(repository.updateStudentWord).toHaveBeenCalledWith(
      "student-1",
      "word-1",
      expect.objectContaining({
        status: "mastered",
        interval_days: 30,
        known_streak: 3
      })
    );
    expect(repository.insertStudentWord).toHaveBeenCalledWith(
      expect.objectContaining({
        student_id: "student-1",
        catalog_slug: "db:card-1",
        status: "difficult",
        interval_days: 0
      })
    );
    expect(repository.insertWordReview).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      totalWords: 2,
      knownCount: 1,
      hardCount: 0,
      unknownCount: 1,
      addedDifficultCount: 1,
      masteredCount: 1
    });
  });

  it("aggregates writes but keeps summary counters from the original answers", async () => {
    getCurrentRealStudentWriteContextMock.mockResolvedValue({
      studentId: "student-1"
    });
    repository.loadStudentWordsByIds.mockResolvedValue({
      data: [
        {
          id: "word-1",
          term: "word",
          translation: "слово",
          status: "learning",
          next_review_at: null,
          created_at: "2026-06-01T00:00:00.000Z"
        }
      ],
      error: null
    });
    const { completeWordSession } = await import(
      "@/lib/words/words.service"
    );

    const result = await completeWordSession([
      { wordId: "word-1", result: "known" },
      { wordId: "word-1", result: "hard" },
      { wordId: "word-1", result: "unknown" }
    ]);

    expect(repository.updateStudentWord).toHaveBeenCalledTimes(1);
    expect(repository.updateStudentWord).toHaveBeenCalledWith(
      "student-1",
      "word-1",
      expect.objectContaining({ status: "difficult" })
    );
    expect(result).toMatchObject({
      totalWords: 1,
      knownCount: 1,
      hardCount: 1,
      unknownCount: 1
    });
  });

  it("returns no write for a missing-schema catalog item and throws other catalog errors", async () => {
    getCurrentRealStudentWriteContextMock.mockResolvedValue({
      studentId: "student-1"
    });
    repository.loadPublishedCatalogItems.mockResolvedValueOnce({
      data: null,
      error: { message: "relation does not exist in schema cache" }
    });
    const { completeWordSession } = await import(
      "@/lib/words/words.service"
    );

    await expect(
      completeWordSession([
        { wordId: "catalog:db:missing", result: "known" }
      ])
    ).resolves.toMatchObject({
      totalWords: 1,
      knownCount: 1
    });
    expect(repository.insertStudentWord).not.toHaveBeenCalled();

    repository.loadPublishedCatalogItems.mockResolvedValueOnce({
      data: null,
      error: { message: "permission denied" }
    });
    await expect(
      completeWordSession([
        { wordId: "catalog:db:forbidden", result: "known" }
      ])
    ).rejects.toMatchObject({ message: "permission denied" });
  });

  it("propagates progress write failures", async () => {
    getCurrentRealStudentWriteContextMock.mockResolvedValue({
      studentId: "student-1"
    });
    repository.loadStudentWordsByIds.mockResolvedValue({
      data: [
        {
          id: "word-1",
          term: "word",
          translation: "слово",
          status: "learning",
          next_review_at: null,
          created_at: "2026-06-01T00:00:00.000Z"
        }
      ],
      error: null
    });
    repository.updateStudentWord.mockResolvedValue({
      data: null,
      error: { message: "update failed" }
    });
    const { completeWordSession } = await import(
      "@/lib/words/words.service"
    );

    await expect(
      completeWordSession([{ wordId: "word-1", result: "known" }])
    ).rejects.toMatchObject({ message: "update failed" });
    expect(repository.insertWordReview).not.toHaveBeenCalled();
  });
});

