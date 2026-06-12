import { cache } from "react";

import { defineDataLoadingDescriptor } from "@/lib/data-loading/contracts";
import { measureServerTiming } from "@/lib/server/timing";
import {
  getCurrentRealStudentWriteContext,
  getCurrentStudentProfile
} from "@/lib/students/current-student";
import type { WordTopic } from "@/lib/words/catalog";
import {
  aggregateWordSessionAnswers,
  buildWordReviewUpdate,
  filterWordSessionCards,
  isWordDueForReview,
  sortWordCardsForSession
} from "@/lib/words/words-review.policy";
import { createUserScopedWordsRepository } from "@/lib/words/words.repository";
import type { WordSessionAnswer, WordSessionParams } from "@/lib/words/validation";
import type {
  DbCatalogWord,
  PublishedWordCardSetRow,
  StudentWordRow,
  WordCard,
  WordProgressMutation,
  WordSession,
  WordSessionSubmitResult,
  WordSetSummary,
  WordTopicDetail,
  WordTopicSummary,
  WordsOverviewSummary
} from "@/lib/words/words.types";

export const WORDS_OVERVIEW_SUMMARY_DATA_LOADING = defineDataLoadingDescriptor({
  id: "words-overview-summary",
  owner: "@/lib/words/words.service#getWordsOverviewSummary",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "summary",
  issues: ["duplicated_fetch"],
  notes: [
    "Summary counters for the student words landing page should stay separate from the full list loader."
  ]
});

export const WORDS_LIST_DATA_LOADING = defineDataLoadingDescriptor({
  id: "words-list",
  owner: "@/lib/words/words.service#getStudentWords",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "list",
  issues: []
});

export const WORDS_REVIEW_QUEUE_DATA_LOADING = defineDataLoadingDescriptor({
  id: "words-review-queue",
  owner: "@/lib/words/words.service#getWordsForReview",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "list",
  issues: []
});

export const WORDS_NEW_LIST_DATA_LOADING = defineDataLoadingDescriptor({
  id: "words-new-list",
  owner: "@/lib/words/words.service#getNewWords",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "list",
  issues: []
});

const FALLBACK_TOPIC = {
  slug: "personal",
  title: "Мои слова",
  description: "Слова из ошибок, homework и ручных добавлений."
};

function isSchemaMissing(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("does not exist") ||
    normalized.includes("could not find") ||
    normalized.includes("schema cache")
  );
}

function fallbackExample(term: string) {
  return `I want to remember "${term}".`;
}

function fallbackExampleTranslation(term: string) {
  return `Я хочу запомнить "${term}".`;
}

function findCatalogWord(
  catalog: DbCatalogWord[],
  catalogSlug: string | null | undefined
) {
  if (!catalogSlug) return null;
  return catalog.find((word) => word.id === catalogSlug) ?? null;
}

function rowToCard(row: StudentWordRow, catalog: DbCatalogWord[]): WordCard {
  const catalogWord = row.catalog_slug
    ? findCatalogWord(catalog, row.catalog_slug)
    : catalog.find(
        (word) => word.term.toLowerCase() === row.term.toLowerCase()
      ) ?? null;
  const topicSlug =
    row.topic_slug ?? catalogWord?.topicSlug ?? FALLBACK_TOPIC.slug;
  const topicTitle =
    row.topic_title ?? catalogWord?.topicTitle ?? FALLBACK_TOPIC.title;

  return {
    id: row.id,
    progressId: row.id,
    catalogId: row.catalog_slug ?? catalogWord?.id ?? null,
    term: row.term,
    translation: row.translation,
    example:
      row.example_sentence ??
      catalogWord?.example ??
      fallbackExample(row.term),
    exampleTranslation:
      row.example_translation ??
      catalogWord?.exampleTranslation ??
      fallbackExampleTranslation(row.term),
    topicSlug,
    topicTitle,
    setSlug: catalogWord?.setSlug ?? null,
    setTitle: catalogWord?.setTitle ?? null,
    setDescription: catalogWord?.setDescription ?? null,
    cefrLevel: catalogWord?.cefrLevel ?? null,
    status: row.status,
    nextReviewAt: row.next_review_at
  };
}

function catalogToCard(word: DbCatalogWord): WordCard {
  return {
    id: `catalog:${word.id}`,
    progressId: null,
    catalogId: word.id,
    term: word.term,
    translation: word.translation,
    example: word.example,
    exampleTranslation: word.exampleTranslation,
    topicSlug: word.topicSlug,
    topicTitle: word.topicTitle,
    setSlug: word.setSlug,
    setTitle: word.setTitle,
    setDescription: word.setDescription,
    cefrLevel: word.cefrLevel ?? null,
    status: "new",
    nextReviewAt: null
  };
}

export function buildCardsFromDbCatalog(
  rows: StudentWordRow[],
  catalog: DbCatalogWord[]
) {
  const cards = rows.map((row) => rowToCard(row, catalog));
  const knownCatalogKeys = new Set(
    cards.flatMap((card) =>
      card.catalogId?.startsWith("db:") ? [card.catalogId] : []
    )
  );

  for (const catalogWord of catalog) {
    if (!knownCatalogKeys.has(catalogWord.id)) {
      cards.push(catalogToCard(catalogWord));
    }
  }

  return cards;
}

export function mapPublishedWordCardSetRowsToCatalog(
  rows: PublishedWordCardSetRow[]
): DbCatalogWord[] {
  return rows
    .filter((set) => set.is_published !== false)
    .flatMap((set) => {
      const setSlug = `db:${set.id}`;
      return [...(set.word_card_items ?? [])]
        .sort(
          (left, right) =>
            Number(left.sort_order ?? 0) - Number(right.sort_order ?? 0)
        )
        .map((item) => ({
          id: `db:${item.id}`,
          topicSlug: set.topic_slug,
          topicTitle: set.topic_title,
          setSlug,
          setTitle: set.title,
          setDescription: set.description,
          term: item.term,
          translation: item.translation,
          example: item.example_sentence,
          exampleTranslation: item.example_translation,
          cefrLevel: set.cefr_level
        }));
    });
}

const loadPublishedWordCardCatalog = cache(
  async (): Promise<DbCatalogWord[]> =>
    measureServerTiming("words-published-card-catalog", async () => {
      const repository = await createUserScopedWordsRepository();
      const { data, error } = await repository.loadPublishedWordCardSets();

      if (error) return [];

      return mapPublishedWordCardSetRowsToCatalog(
        (data ?? []) as PublishedWordCardSetRow[]
      );
    })
);

const loadStudentWordsByStudent = cache(async (studentId: string) =>
  measureServerTiming("words-all-data", async () => {
    const repository = await createUserScopedWordsRepository();
    const { data, error } = await repository.loadStudentWords(studentId);

    if (error) return [];
    return (data ?? []) as StudentWordRow[];
  })
);

async function loadStudentCards(studentId: string) {
  const [rows, dbCatalog] = await Promise.all([
    loadStudentWordsByStudent(studentId),
    loadPublishedWordCardCatalog()
  ]);
  return buildCardsFromDbCatalog(rows, dbCatalog);
}

export function buildWordsOverviewSummary(input: {
  words: Array<{
    status?: string | null;
    nextReviewAt?: string | null;
    next_review_at?: string | null;
  }>;
  reviewWords: Array<unknown>;
  newWords: Array<unknown>;
}): WordsOverviewSummary {
  const activeCount = input.words.filter(
    (item) => item.status !== "mastered"
  ).length;
  const difficultCount = input.words.filter(
    (item) => item.status === "difficult"
  ).length;
  const masteredCount = input.words.filter(
    (item) => item.status === "mastered"
  ).length;

  return {
    totalWords: input.words.length,
    reviewCount: input.reviewWords.length,
    newCount: input.newWords.length,
    activeCount,
    difficultCount,
    masteredCount
  };
}

export async function getWordsOverviewSummary(): Promise<WordsOverviewSummary> {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) {
    return {
      totalWords: 0,
      reviewCount: 0,
      newCount: 0,
      activeCount: 0,
      difficultCount: 0,
      masteredCount: 0
    };
  }

  const cards = await loadStudentCards(profile.studentId);
  return buildWordsOverviewSummary({
    words: cards,
    reviewWords: cards.filter((card) => isWordDueForReview(card)),
    newWords: cards.filter((card) => card.status === "new")
  });
}

export async function getStudentWords() {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) return [];
  return loadStudentCards(profile.studentId);
}

export async function getWordsForReview() {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) return [];
  return sortWordCardsForSession(
    (await loadStudentCards(profile.studentId)).filter((card) =>
      isWordDueForReview(card)
    )
  );
}

export async function getNewWords() {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) return [];
  return sortWordCardsForSession(
    (await loadStudentCards(profile.studentId)).filter(
      (card) => card.status === "new"
    )
  ).slice(0, 50);
}

export async function getDifficultWords() {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) return [];
  return sortWordCardsForSession(
    (await loadStudentCards(profile.studentId)).filter(
      (card) => card.status === "difficult"
    )
  );
}

export async function getWordTopicSummaries(): Promise<WordTopicSummary[]> {
  const cards = await getStudentWords();
  const topics = new Map<string, WordTopic>();

  for (const card of cards) {
    if (!topics.has(card.topicSlug)) {
      topics.set(card.topicSlug, {
        slug: card.topicSlug,
        title: card.topicTitle,
        description: "Кураторские наборы карточек для этой темы."
      });
    }
  }

  return [...topics.values()].map((topic) => {
    const topicCards = cards.filter((card) => card.topicSlug === topic.slug);
    return {
      ...topic,
      availableCount: topicCards.filter((card) => card.status !== "mastered")
        .length,
      difficultCount: topicCards.filter(
        (card) => card.status === "difficult"
      ).length
    };
  });
}

export async function getWordTopicDetail(
  topicSlug: string
): Promise<WordTopicDetail | null> {
  const cards = await getStudentWords();
  const topicCards = cards.filter((card) => card.topicSlug === topicSlug);
  const topic =
    topicCards.length > 0
      ? {
          slug: topicSlug,
          title: topicCards[0]?.topicTitle ?? topicSlug,
          description: "Кураторские наборы карточек для этой темы."
        }
      : null;
  if (!topic) return null;

  const setMap = new Map<string, WordSetSummary>();
  for (const card of topicCards) {
    if (!card.setSlug) continue;
    if (!setMap.has(card.setSlug)) {
      setMap.set(card.setSlug, {
        slug: card.setSlug,
        topicSlug: card.topicSlug,
        title: card.setTitle ?? card.setSlug,
        description:
          card.setDescription ??
          (card.cefrLevel ? `Уровень ${card.cefrLevel}` : "Набор карточек"),
        cefrLevel: card.cefrLevel ?? null,
        availableCount: 0,
        difficultCount: 0,
        masteredCount: 0,
        previewWords: []
      });
    }
  }

  const sets = [...setMap.values()].map((set) => {
    const setCards = topicCards.filter((card) => card.setSlug === set.slug);
    return {
      ...set,
      cefrLevel: set.cefrLevel ?? setCards[0]?.cefrLevel ?? null,
      availableCount: setCards.filter((card) => card.status !== "mastered")
        .length,
      difficultCount: setCards.filter(
        (card) => card.status === "difficult"
      ).length,
      masteredCount: setCards.filter((card) => card.status === "mastered")
        .length,
      previewWords: setCards.slice(0, 4).map((card) => ({
        term: card.term,
        translation: card.translation
      }))
    };
  });

  return {
    topic,
    availableCount: topicCards.filter((card) => card.status !== "mastered")
      .length,
    difficultCount: topicCards.filter((card) => card.status === "difficult")
      .length,
    masteredCount: topicCards.filter((card) => card.status === "mastered")
      .length,
    sets
  };
}

export async function buildWordSession(
  params: WordSessionParams
): Promise<WordSession> {
  const cards = await getStudentWords();
  const words = sortWordCardsForSession(
    filterWordSessionCards(cards, params)
  ).slice(0, params.limit);
  const matchedCard =
    words[0] ??
    (params.setSlug
      ? cards.find((card) => card.setSlug === params.setSlug)
      : params.topicSlug
        ? cards.find((card) => card.topicSlug === params.topicSlug)
        : null);
  const topic =
    params.topicSlug && matchedCard
      ? {
          slug: matchedCard.topicSlug,
          title: matchedCard.topicTitle,
          description: ""
        }
      : null;
  const set =
    params.setSlug && matchedCard?.setSlug === params.setSlug
      ? {
          slug: matchedCard.setSlug,
          topicSlug: matchedCard.topicSlug,
          title: matchedCard.setTitle ?? matchedCard.setSlug,
          description: matchedCard.setDescription ?? ""
        }
      : null;

  return {
    mode: params.mode,
    topicSlug: params.topicSlug ?? null,
    setSlug: params.setSlug ?? null,
    topicTitle:
      set && topic
        ? `${topic.title} · ${set.title}`
        : topic?.title ??
          (params.mode === "difficult"
            ? "Сложные слова"
            : params.mode === "review"
              ? "Повторение"
              : "Карточки"),
    limit: params.limit,
    words
  };
}

function catalogSlugFromAnswer(wordId: string) {
  if (!wordId.startsWith("catalog:")) return null;
  return wordId.replace("catalog:", "");
}

function resolveCatalogFromAnswer(
  wordId: string,
  dbCatalog: Map<string, DbCatalogWord>
) {
  if (!wordId.startsWith("catalog:")) return null;
  const catalogId = wordId.replace("catalog:", "");
  if (catalogId.startsWith("db:")) return dbCatalog.get(catalogId) ?? null;
  return null;
}

async function loadDbCatalogWordsByAnswerIds(
  repository: Awaited<ReturnType<typeof createUserScopedWordsRepository>>,
  answers: WordSessionAnswer[]
) {
  const dbIds = answers
    .map((answer) => catalogSlugFromAnswer(answer.wordId))
    .filter(
      (catalogId): catalogId is string =>
        Boolean(catalogId?.startsWith("db:"))
    )
    .map((catalogId) => catalogId.replace("db:", ""));

  if (dbIds.length === 0) return new Map<string, DbCatalogWord>();

  const { data, error } = await repository.loadPublishedCatalogItems(dbIds);
  if (error) {
    if (isSchemaMissing(error.message)) return new Map<string, DbCatalogWord>();
    throw error;
  }

  const result = new Map<string, DbCatalogWord>();
  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    const set = row.word_card_sets as Record<string, unknown> | null;
    if (!set) continue;
    const catalogId = `db:${String(row.id)}`;
    result.set(catalogId, {
      id: catalogId,
      topicSlug: String(set.topic_slug ?? ""),
      topicTitle: String(set.topic_title ?? ""),
      setSlug: `db:${String(set.id)}`,
      setTitle: String(set.title ?? ""),
      setDescription:
        set.description == null ? null : String(set.description),
      term: String(row.term ?? ""),
      translation: String(row.translation ?? ""),
      example: String(row.example_sentence ?? ""),
      exampleTranslation: String(row.example_translation ?? ""),
      cefrLevel: String(set.cefr_level ?? "")
    });
  }
  return result;
}

async function loadExistingProgress(
  repository: Awaited<ReturnType<typeof createUserScopedWordsRepository>>,
  studentId: string,
  answers: WordSessionAnswer[]
) {
  const ids = answers
    .filter((answer) => !answer.wordId.startsWith("catalog:"))
    .map((answer) => answer.wordId);
  const catalogIds = answers
    .map((answer) => catalogSlugFromAnswer(answer.wordId))
    .filter((catalogId): catalogId is string => Boolean(catalogId));
  const rows: StudentWordRow[] = [];

  if (ids.length > 0) {
    const { data } = await repository.loadStudentWordsByIds(studentId, ids);
    rows.push(...((data ?? []) as StudentWordRow[]));
  }

  if (catalogIds.length > 0) {
    const { data } = await repository.loadStudentWordsByCatalogSlugs(
      studentId,
      catalogIds
    );
    rows.push(...((data ?? []) as StudentWordRow[]));
  }

  return rows;
}

function toProgressMutation(
  update: ReturnType<typeof buildWordReviewUpdate>
): WordProgressMutation {
  return {
    status: update.status,
    next_review_at: update.next_review_at,
    last_reviewed_at: update.last_reviewed_at,
    interval_days: update.interval_days,
    review_count: update.review_count,
    known_streak: update.known_streak,
    hard_count: update.hard_count,
    unknown_count: update.unknown_count,
    difficult_marked_at: update.difficult_marked_at
  };
}

export async function completeWordSession(
  answers: WordSessionAnswer[]
): Promise<WordSessionSubmitResult> {
  const studentContext = await getCurrentRealStudentWriteContext(
    "words.sessions.complete"
  );
  const repository = await createUserScopedWordsRepository();
  const uniqueAnswers = aggregateWordSessionAnswers(answers);
  const [rows, dbCatalog] = await Promise.all([
    loadExistingProgress(repository, studentContext.studentId, uniqueAnswers),
    loadDbCatalogWordsByAnswerIds(repository, uniqueAnswers)
  ]);
  const rowsById = new Map(rows.map((row) => [row.id, row]));
  const rowsByCatalog = new Map(
    rows
      .filter((row) => row.catalog_slug)
      .map((row) => [row.catalog_slug as string, row])
  );
  const baseDate = new Date();
  let addedDifficultCount = 0;
  let masteredCount = 0;

  for (const answer of uniqueAnswers) {
    const catalogWord = resolveCatalogFromAnswer(answer.wordId, dbCatalog);
    const row = catalogWord
      ? rowsByCatalog.get(catalogWord.id) ?? null
      : rowsById.get(answer.wordId) ?? null;
    const update = buildWordReviewUpdate(row, answer, baseDate);
    if (update.addedDifficult) addedDifficultCount += 1;
    if (update.mastered && row?.status !== "mastered") masteredCount += 1;

    const mutation = toProgressMutation(update);
    let progressId = row?.id ?? null;

    if (row) {
      const { error } = await repository.updateStudentWord(
        studentContext.studentId,
        row.id,
        mutation
      );
      if (error) throw error;
    } else if (catalogWord) {
      const { data, error } = await repository.insertStudentWord({
        student_id: studentContext.studentId,
        term: catalogWord.term,
        translation: catalogWord.translation,
        source_type: "manual",
        source_entity_id: null,
        topic_slug: catalogWord.topicSlug,
        topic_title: catalogWord.topicTitle,
        example_sentence: catalogWord.example,
        example_translation: catalogWord.exampleTranslation,
        catalog_slug: catalogWord.id,
        ...mutation
      });
      if (error) throw error;
      progressId = data?.id ?? null;
    }

    if (progressId) {
      await repository.insertWordReview({
        student_word_id: progressId,
        student_id: studentContext.studentId,
        result:
          answer.result === "known"
            ? "good"
            : answer.result === "hard"
              ? "hard"
              : "again",
        reviewed_at: new Date().toISOString()
      });
    }
  }

  return {
    totalWords: uniqueAnswers.length,
    knownCount: answers.filter((answer) => answer.result === "known").length,
    hardCount: answers.filter((answer) => answer.result === "hard").length,
    unknownCount: answers.filter((answer) => answer.result === "unknown")
      .length,
    addedDifficultCount,
    masteredCount
  };
}
