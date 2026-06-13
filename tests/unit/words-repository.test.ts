import { describe, expect, it, vi } from "vitest";

import { createWordsRepository } from "@/lib/words/words.repository";

function makeQueryResult(data: unknown = null, error: unknown = null) {
  const result = { data, error };
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    order: vi.fn(() => builder),
    update: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    single: vi.fn(async () => result),
    then: (resolve: (value: typeof result) => unknown) =>
      Promise.resolve(result).then(resolve),
    catch: (reject: (reason: unknown) => unknown) =>
      Promise.resolve(result).catch(reject),
    finally: (callback: () => void) =>
      Promise.resolve(result).finally(callback)
  };
  return builder;
}

describe("words repository", () => {
  it("loads published catalog sets with the existing relation fields and ordering", async () => {
    const query = makeQueryResult([]);
    const fromMock = vi.fn(() => query);
    const repository = createWordsRepository({ from: fromMock } as never);

    await repository.loadPublishedWordCardSets();

    expect(fromMock).toHaveBeenCalledWith("word_card_sets");
    expect(query.select).toHaveBeenCalledWith(
      "id, title, description, topic_slug, topic_title, cefr_level, sort_order, word_card_items(id, term, translation, example_sentence, example_translation, sort_order)"
    );
    expect(query.eq).toHaveBeenCalledWith("is_published", true);
    expect(query.order).toHaveBeenCalledWith("sort_order", {
      ascending: true
    });
  });

  it("loads student words by owner, id, and catalog slug with the full progress shape", async () => {
    const allWordsQuery = makeQueryResult([]);
    const idsQuery = makeQueryResult([]);
    const catalogQuery = makeQueryResult([]);
    const queries = [allWordsQuery, idsQuery, catalogQuery];
    const fromMock = vi.fn(() => queries.shift());
    const repository = createWordsRepository({ from: fromMock } as never);

    await repository.loadStudentWords("student-1");
    await repository.loadStudentWordsByIds("student-1", ["word-1"]);
    await repository.loadStudentWordsByCatalogSlugs("student-1", [
      "db:card-1"
    ]);

    expect(fromMock).toHaveBeenNthCalledWith(1, "student_words");
    expect(fromMock).toHaveBeenNthCalledWith(2, "student_words");
    expect(fromMock).toHaveBeenNthCalledWith(3, "student_words");
    expect(allWordsQuery.select).toHaveBeenCalledWith(
      "id, term, translation, source_type, source_entity_id, status, next_review_at, last_reviewed_at, ease_factor, interval_days, review_count, topic_slug, topic_title, example_sentence, example_translation, catalog_slug, known_streak, hard_count, unknown_count, difficult_marked_at, created_at"
    );
    expect(allWordsQuery.eq).toHaveBeenCalledWith(
      "student_id",
      "student-1"
    );
    expect(allWordsQuery.order).toHaveBeenCalledWith("created_at", {
      ascending: false
    });
    expect(idsQuery.eq).toHaveBeenCalledWith("student_id", "student-1");
    expect(idsQuery.in).toHaveBeenCalledWith("id", ["word-1"]);
    expect(catalogQuery.eq).toHaveBeenCalledWith(
      "student_id",
      "student-1"
    );
    expect(catalogQuery.in).toHaveBeenCalledWith("catalog_slug", [
      "db:card-1"
    ]);
    expect(queries).toHaveLength(0);
  });

  it("loads only published catalog items requested for completion", async () => {
    const query = makeQueryResult([]);
    const fromMock = vi.fn(() => query);
    const repository = createWordsRepository({ from: fromMock } as never);

    await repository.loadPublishedCatalogItems(["card-1", "card-2"]);

    expect(fromMock).toHaveBeenCalledWith("word_card_items");
    expect(query.select).toHaveBeenCalledWith(
      "id, term, translation, example_sentence, example_translation, sort_order, word_card_sets!inner(id, title, description, topic_slug, topic_title, cefr_level, is_published)"
    );
    expect(query.in).toHaveBeenCalledWith("id", ["card-1", "card-2"]);
    expect(query.eq).toHaveBeenCalledWith(
      "word_card_sets.is_published",
      true
    );
  });

  it("preserves update, insert, and review-history payload boundaries", async () => {
    const updateQuery = makeQueryResult();
    const insertQuery = makeQueryResult({ id: "word-2" });
    const reviewQuery = makeQueryResult();
    const fromMock = vi
      .fn()
      .mockReturnValueOnce(updateQuery)
      .mockReturnValueOnce(insertQuery)
      .mockReturnValueOnce(reviewQuery);
    const repository = createWordsRepository({ from: fromMock } as never);
    const mutation = {
      status: "learning" as const,
      next_review_at: "2026-06-15T00:00:00.000Z",
      last_reviewed_at: "2026-06-12T00:00:00.000Z",
      interval_days: 3,
      review_count: 2,
      known_streak: 1,
      hard_count: 0,
      unknown_count: 0,
      difficult_marked_at: null
    };

    await repository.updateStudentWord("student-1", "word-1", mutation);
    await repository.insertStudentWord({
      student_id: "student-1",
      term: "menu",
      translation: "меню",
      source_type: "manual",
      source_entity_id: null,
      topic_slug: "food",
      topic_title: "Еда",
      example_sentence: "A menu.",
      example_translation: "Меню.",
      catalog_slug: "db:card-1",
      ...mutation
    });
    await repository.insertWordReview({
      student_word_id: "word-1",
      student_id: "student-1",
      result: "good",
      reviewed_at: "2026-06-12T00:00:00.000Z"
    });

    expect(updateQuery.update).toHaveBeenCalledWith(mutation);
    expect(updateQuery.eq).toHaveBeenNthCalledWith(1, "id", "word-1");
    expect(updateQuery.eq).toHaveBeenNthCalledWith(
      2,
      "student_id",
      "student-1"
    );
    expect(insertQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        student_id: "student-1",
        catalog_slug: "db:card-1",
        status: "learning"
      })
    );
    expect(insertQuery.select).toHaveBeenCalledWith("id");
    expect(insertQuery.single).toHaveBeenCalledTimes(1);
    expect(reviewQuery.insert).toHaveBeenCalledWith({
      student_word_id: "word-1",
      student_id: "student-1",
      result: "good",
      reviewed_at: "2026-06-12T00:00:00.000Z"
    });
  });
});
