import { cache } from "react";

import type { WordSet, WordTopic } from "@/lib/words/catalog";
import { measureServerTiming } from "@/lib/server/timing";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStudentProfile } from "@/lib/students/current-student";
import { defineDataLoadingDescriptor } from "@/lib/data-loading/contracts";
import type { WordSessionAnswer, WordSessionMode, WordSessionParams } from "@/lib/words/validation";

export type WordProgressStatus = "new" | "learning" | "review" | "difficult" | "mastered";

export type StudentWordRow = {
  id: string;
  term: string;
  translation: string;
  source_type?: string | null;
  source_entity_id?: string | null;
  status: WordProgressStatus;
  next_review_at: string | null;
  last_reviewed_at?: string | null;
  ease_factor?: number | null;
  interval_days?: number | null;
  review_count?: number | null;
  topic_slug?: string | null;
  topic_title?: string | null;
  example_sentence?: string | null;
  example_translation?: string | null;
  catalog_slug?: string | null;
  known_streak?: number | null;
  hard_count?: number | null;
  unknown_count?: number | null;
  difficult_marked_at?: string | null;
  created_at: string;
};

export type WordCard = {
  id: string;
  progressId: string | null;
  catalogId: string | null;
  term: string;
  translation: string;
  example: string;
  exampleTranslation: string;
  topicSlug: string;
  topicTitle: string;
  setSlug: string | null;
  setTitle: string | null;
  setDescription?: string | null;
  cefrLevel?: string | null;
  status: WordProgressStatus;
  nextReviewAt: string | null;
};

export type WordsOverviewSummary = {
  totalWords: number;
  reviewCount: number;
  newCount: number;
  activeCount: number;
  difficultCount: number;
  masteredCount: number;
};

export type WordTopicSummary = {
  slug: string;
  title: string;
  description: string;
  availableCount: number;
  difficultCount: number;
};

export type WordSetSummary = WordSet & {
  cefrLevel?: string | null;
  availableCount: number;
  difficultCount: number;
  masteredCount: number;
  previewWords: Array<{
    term: string;
    translation: string;
  }>;
};

export type WordTopicDetail = {
  topic: WordTopic;
  availableCount: number;
  difficultCount: number;
  masteredCount: number;
  sets: WordSetSummary[];
};

export type WordSession = {
  mode: WordSessionMode;
  topicSlug: string | null;
  setSlug: string | null;
  topicTitle: string;
  limit: number;
  words: WordCard[];
};

export type WordSessionSubmitResult = {
  totalWords: number;
  knownCount: number;
  hardCount: number;
  unknownCount: number;
  addedDifficultCount: number;
  masteredCount: number;
};

export const WORDS_OVERVIEW_SUMMARY_DATA_LOADING = defineDataLoadingDescriptor({
  id: "words-overview-summary",
  owner: "@/lib/words/queries#getWordsOverviewSummary",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "summary",
  issues: ["duplicated_fetch"],
  notes: ["Summary counters for the student words landing page should stay separate from the full list loader."]
});

export const WORDS_LIST_DATA_LOADING = defineDataLoadingDescriptor({
  id: "words-list",
  owner: "@/lib/words/queries#getStudentWords",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "list",
  issues: []
});

export const WORDS_REVIEW_QUEUE_DATA_LOADING = defineDataLoadingDescriptor({
  id: "words-review-queue",
  owner: "@/lib/words/queries#getWordsForReview",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "list",
  issues: []
});

export const WORDS_NEW_LIST_DATA_LOADING = defineDataLoadingDescriptor({
  id: "words-new-list",
  owner: "@/lib/words/queries#getNewWords",
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

export type DbCatalogWord = {
  id: string;
  topicSlug: string;
  topicTitle: string;
  setSlug: string;
  setTitle: string;
  setDescription: string | null;
  term: string;
  translation: string;
  example: string;
  exampleTranslation: string;
  cefrLevel?: string | null;
};

export type PublishedWordCardSetRow = {
  id: string;
  title: string;
  description: string | null;
  topic_slug: string;
  topic_title: string;
  cefr_level: string;
  is_published?: boolean | null;
  sort_order: number | null;
  word_card_items?: Array<{
    id: string;
    term: string;
    translation: string;
    example_sentence: string;
    example_translation: string;
    sort_order: number | null;
  }> | null;
};

function isSchemaMissing(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("does not exist") || normalized.includes("could not find") || normalized.includes("schema cache");
}

function nowIso() {
  return new Date().toISOString();
}

function isDueForReview(word: Pick<WordCard, "status" | "nextReviewAt">, now = new Date()) {
  if (word.status === "mastered") return false;
  if (word.status === "new") return false;
  if (!word.nextReviewAt) return true;
  return new Date(word.nextReviewAt).getTime() <= now.getTime();
}

function fallbackExample(term: string) {
  return `I want to remember "${term}".`;
}

function fallbackExampleTranslation(term: string) {
  return `Я хочу запомнить "${term}".`;
}

function findCatalogWord(catalog: DbCatalogWord[], catalogSlug: string | null | undefined) {
  if (!catalogSlug) return null;
  return catalog.find((word) => word.id === catalogSlug) ?? null;
}

function rowToCard(row: StudentWordRow, catalog: DbCatalogWord[]): WordCard {
  const catalogWord = row.catalog_slug ? findCatalogWord(catalog, row.catalog_slug) : catalog.find((word) => word.term.toLowerCase() === row.term.toLowerCase()) ?? null;
  const topicSlug = row.topic_slug ?? catalogWord?.topicSlug ?? FALLBACK_TOPIC.slug;
  const topicTitle = row.topic_title ?? catalogWord?.topicTitle ?? FALLBACK_TOPIC.title;

  return {
    id: row.id,
    progressId: row.id,
    catalogId: row.catalog_slug ?? catalogWord?.id ?? null,
    term: row.term,
    translation: row.translation,
    example: row.example_sentence ?? catalogWord?.example ?? fallbackExample(row.term),
    exampleTranslation: row.example_translation ?? catalogWord?.exampleTranslation ?? fallbackExampleTranslation(row.term),
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

export function buildCardsFromDbCatalog(rows: StudentWordRow[], catalog: DbCatalogWord[]) {
  const cards = rows.map((row) => rowToCard(row, catalog));
  const knownCatalogKeys = new Set(cards.flatMap((card) => (card.catalogId?.startsWith("db:") ? [card.catalogId] : [])));

  for (const catalogWord of catalog) {
    if (!knownCatalogKeys.has(catalogWord.id)) {
      cards.push(catalogToCard(catalogWord));
    }
  }

  return cards;
}

const loadPublishedWordCardCatalog = cache(async (): Promise<DbCatalogWord[]> =>
  measureServerTiming("words-published-card-catalog", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("word_card_sets")
      .select("id, title, description, topic_slug, topic_title, cefr_level, sort_order, word_card_items(id, term, translation, example_sentence, example_translation, sort_order)")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (error) {
      if (isSchemaMissing(error.message)) return [];
      return [];
    }

    return mapPublishedWordCardSetRowsToCatalog((data ?? []) as PublishedWordCardSetRow[]);
  })
);

export function mapPublishedWordCardSetRowsToCatalog(rows: PublishedWordCardSetRow[]): DbCatalogWord[] {
  return rows
    .filter((set) => set.is_published !== false)
    .flatMap((set) => {
      const setSlug = `db:${set.id}`;
      return [...(set.word_card_items ?? [])]
        .sort((left, right) => Number(left.sort_order ?? 0) - Number(right.sort_order ?? 0))
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

async function loadStudentCards(studentId: string) {
  const [rows, dbCatalog] = await Promise.all([loadStudentWordsByStudent(studentId), loadPublishedWordCardCatalog()]);
  return buildCardsFromDbCatalog(rows, dbCatalog);
}

function sortCardsForSession(cards: WordCard[]) {
  return [...cards].sort((a, b) => {
    const aDate = a.nextReviewAt ? new Date(a.nextReviewAt).getTime() : 0;
    const bDate = b.nextReviewAt ? new Date(b.nextReviewAt).getTime() : 0;
    if (aDate !== bDate) return aDate - bDate;
    return a.term.localeCompare(b.term);
  });
}

function filterSessionCards(cards: WordCard[], params: WordSessionParams) {
  const scopedCards = cards.filter((card) => {
    if (params.topicSlug && card.topicSlug !== params.topicSlug) return false;
    if (params.setSlug && card.setSlug !== params.setSlug) return false;
    return true;
  });

  if (params.mode === "new") {
    return scopedCards.filter((card) => card.status === "new");
  }

  if (params.mode === "review") {
    return scopedCards.filter((card) => isDueForReview(card));
  }

  if (params.mode === "difficult") {
    return scopedCards.filter((card) => card.status === "difficult");
  }

  const dueCards = scopedCards.filter((card) => isDueForReview(card));
  const newCards = scopedCards.filter((card) => card.status === "new").slice(0, 5);
  const usedIds = new Set(dueCards.map((card) => card.id));
  return [...dueCards, ...newCards.filter((card) => !usedIds.has(card.id))];
}

const loadStudentWordsByStudent = cache(async (studentId: string) =>
  measureServerTiming("words-all-data", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("student_words")
      .select(
        "id, term, translation, source_type, source_entity_id, status, next_review_at, last_reviewed_at, ease_factor, interval_days, review_count, topic_slug, topic_title, example_sentence, example_translation, catalog_slug, known_streak, hard_count, unknown_count, difficult_marked_at, created_at"
      )
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) {
      if (isSchemaMissing(error.message)) return [];
      return [];
    }

    return (data ?? []) as StudentWordRow[];
  })
);

export function buildWordsOverviewSummary(input: {
  words: Array<{ status?: string | null; nextReviewAt?: string | null; next_review_at?: string | null }>;
  reviewWords: Array<unknown>;
  newWords: Array<unknown>;
}): WordsOverviewSummary {
  const activeCount = input.words.filter((item) => item.status !== "mastered").length;
  const difficultCount = input.words.filter((item) => item.status === "difficult").length;
  const masteredCount = input.words.filter((item) => item.status === "mastered").length;

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
    reviewWords: cards.filter((card) => isDueForReview(card)),
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
  return sortCardsForSession((await loadStudentCards(profile.studentId)).filter((card) => isDueForReview(card)));
}

export async function getNewWords() {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) return [];
  return sortCardsForSession((await loadStudentCards(profile.studentId)).filter((card) => card.status === "new")).slice(0, 50);
}

export async function getDifficultWords() {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) return [];
  return sortCardsForSession((await loadStudentCards(profile.studentId)).filter((card) => card.status === "difficult"));
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
      availableCount: topicCards.filter((card) => card.status !== "mastered").length,
      difficultCount: topicCards.filter((card) => card.status === "difficult").length
    };
  });
}

export async function getWordTopicDetail(topicSlug: string): Promise<WordTopicDetail | null> {
  const cards = await getStudentWords();
  const topicCards = cards.filter((card) => card.topicSlug === topicSlug);
  const topic = topicCards.length > 0
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
        description: card.setDescription ?? (card.cefrLevel ? `Уровень ${card.cefrLevel}` : "Набор карточек"),
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
      availableCount: setCards.filter((card) => card.status !== "mastered").length,
      difficultCount: setCards.filter((card) => card.status === "difficult").length,
      masteredCount: setCards.filter((card) => card.status === "mastered").length,
      previewWords: setCards.slice(0, 4).map((card) => ({
        term: card.term,
        translation: card.translation
      }))
    };
  });

  return {
    topic,
    availableCount: topicCards.filter((card) => card.status !== "mastered").length,
    difficultCount: topicCards.filter((card) => card.status === "difficult").length,
    masteredCount: topicCards.filter((card) => card.status === "mastered").length,
    sets
  };
}

export async function buildWordSession(params: WordSessionParams): Promise<WordSession> {
  const cards = await getStudentWords();
  const words = sortCardsForSession(filterSessionCards(cards, params)).slice(0, params.limit);
  const matchedCard = words[0] ?? (params.setSlug ? cards.find((card) => card.setSlug === params.setSlug) : params.topicSlug ? cards.find((card) => card.topicSlug === params.topicSlug) : null);
  const topic = params.topicSlug && matchedCard ? { slug: matchedCard.topicSlug, title: matchedCard.topicTitle, description: "" } : null;
  const set = params.setSlug && matchedCard?.setSlug === params.setSlug
    ? { slug: matchedCard.setSlug, topicSlug: matchedCard.topicSlug, title: matchedCard.setTitle ?? matchedCard.setSlug, description: matchedCard.setDescription ?? "" }
    : null;

  return {
    mode: params.mode,
    topicSlug: params.topicSlug ?? null,
    setSlug: params.setSlug ?? null,
    topicTitle: set && topic ? `${topic.title} · ${set.title}` : topic?.title ?? (params.mode === "difficult" ? "Сложные слова" : params.mode === "review" ? "Повторение" : "Карточки"),
    limit: params.limit,
    words
  };
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000).toISOString();
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

function aggregateAnswers(answers: WordSessionAnswer[]) {
  const map = new Map<string, WordSessionAnswer>();
  for (const answer of answers) {
    const current = map.get(answer.wordId);
    if (!current) {
      map.set(answer.wordId, answer);
      continue;
    }

    const result =
      current.result === "unknown" || answer.result === "unknown"
        ? "unknown"
        : current.result === "hard" || answer.result === "hard"
          ? "hard"
          : "known";

    map.set(answer.wordId, {
      wordId: answer.wordId,
      result,
      markedDifficult: current.markedDifficult || answer.markedDifficult
    });
  }
  return [...map.values()];
}

function resolveCatalogFromAnswer(wordId: string, dbCatalog: Map<string, DbCatalogWord> = new Map()) {
  if (!wordId.startsWith("catalog:")) return null;
  const catalogId = wordId.replace("catalog:", "");
  if (catalogId.startsWith("db:")) return dbCatalog.get(catalogId) ?? null;
  return null;
}

function catalogSlugFromAnswer(wordId: string) {
  if (!wordId.startsWith("catalog:")) return null;
  return wordId.replace("catalog:", "");
}

async function loadDbCatalogWordsByAnswerIds(answers: WordSessionAnswer[]) {
  const dbIds = answers
    .map((answer) => catalogSlugFromAnswer(answer.wordId))
    .filter((catalogId): catalogId is string => Boolean(catalogId?.startsWith("db:")))
    .map((catalogId) => catalogId.replace("db:", ""));

  if (dbIds.length === 0) return new Map<string, DbCatalogWord>();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("word_card_items")
    .select("id, term, translation, example_sentence, example_translation, sort_order, word_card_sets!inner(id, title, description, topic_slug, topic_title, cefr_level, is_published)")
    .in("id", dbIds)
    .eq("word_card_sets.is_published", true);

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
      setDescription: set.description == null ? null : String(set.description),
      term: String(row.term ?? ""),
      translation: String(row.translation ?? ""),
      example: String(row.example_sentence ?? ""),
      exampleTranslation: String(row.example_translation ?? ""),
      cefrLevel: String(set.cefr_level ?? "")
    });
  }
  return result;
}

function buildUpdateForAnswer(row: StudentWordRow | null, answer: WordSessionAnswer, baseDate: Date) {
  const reviewCount = Number(row?.review_count ?? 0) + 1;
  const currentInterval = Number(row?.interval_days ?? 0);
  const currentStreak = Number(row?.known_streak ?? 0);
  const wasDifficult = row?.status === "difficult";
  const markedDifficult = Boolean(answer.markedDifficult);

  if (answer.result === "unknown") {
    return {
      status: "difficult",
      next_review_at: addHours(baseDate, 4),
      last_reviewed_at: baseDate.toISOString(),
      interval_days: 0,
      review_count: reviewCount,
      known_streak: 0,
      hard_count: Number(row?.hard_count ?? 0),
      unknown_count: Number(row?.unknown_count ?? 0) + 1,
      difficult_marked_at: row?.difficult_marked_at ?? baseDate.toISOString(),
      addedDifficult: !wasDifficult,
      mastered: false
    };
  }

  if (answer.result === "hard" || markedDifficult) {
    return {
      status: markedDifficult ? "difficult" : "learning",
      next_review_at: markedDifficult ? addHours(baseDate, 12) : addDays(baseDate, 1),
      last_reviewed_at: baseDate.toISOString(),
      interval_days: 1,
      review_count: reviewCount,
      known_streak: 0,
      hard_count: Number(row?.hard_count ?? 0) + 1,
      unknown_count: Number(row?.unknown_count ?? 0),
      difficult_marked_at: markedDifficult ? row?.difficult_marked_at ?? baseDate.toISOString() : row?.difficult_marked_at ?? null,
      addedDifficult: markedDifficult && !wasDifficult,
      mastered: false
    };
  }

  const nextStreak = currentStreak + 1;
  const mastered = nextStreak >= 3;
  const nextInterval = mastered ? 30 : Math.max(3, currentInterval > 0 ? currentInterval * 2 : 3);

  return {
    status: mastered ? "mastered" : "learning",
    next_review_at: addDays(baseDate, nextInterval),
    last_reviewed_at: baseDate.toISOString(),
    interval_days: nextInterval,
    review_count: reviewCount,
    known_streak: nextStreak,
    hard_count: Number(row?.hard_count ?? 0),
    unknown_count: Number(row?.unknown_count ?? 0),
    difficult_marked_at: row?.difficult_marked_at ?? null,
    addedDifficult: false,
    mastered
  };
}

async function loadExistingProgress(studentId: string, answers: WordSessionAnswer[]) {
  const ids = answers.filter((answer) => !answer.wordId.startsWith("catalog:")).map((answer) => answer.wordId);
  const catalogIds = answers.map((answer) => catalogSlugFromAnswer(answer.wordId)).filter((catalogId): catalogId is string => Boolean(catalogId));

  const supabase = await createClient();
  const rows: StudentWordRow[] = [];

  if (ids.length > 0) {
    const { data } = await supabase
      .from("student_words")
      .select(
        "id, term, translation, source_type, source_entity_id, status, next_review_at, last_reviewed_at, ease_factor, interval_days, review_count, topic_slug, topic_title, example_sentence, example_translation, catalog_slug, known_streak, hard_count, unknown_count, difficult_marked_at, created_at"
      )
      .eq("student_id", studentId)
      .in("id", ids);
    rows.push(...(((data ?? []) as StudentWordRow[]) ?? []));
  }

  if (catalogIds.length > 0) {
    const { data } = await supabase
      .from("student_words")
      .select(
        "id, term, translation, source_type, source_entity_id, status, next_review_at, last_reviewed_at, ease_factor, interval_days, review_count, topic_slug, topic_title, example_sentence, example_translation, catalog_slug, known_streak, hard_count, unknown_count, difficult_marked_at, created_at"
      )
      .eq("student_id", studentId)
      .in("catalog_slug", catalogIds);
    rows.push(...(((data ?? []) as StudentWordRow[]) ?? []));
  }

  return rows;
}

export async function completeWordSession(answers: WordSessionAnswer[]): Promise<WordSessionSubmitResult> {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) {
    throw new Error("Student profile is required");
  }

  const uniqueAnswers = aggregateAnswers(answers);
  const [rows, dbCatalog] = await Promise.all([loadExistingProgress(profile.studentId, uniqueAnswers), loadDbCatalogWordsByAnswerIds(uniqueAnswers)]);
  const rowsById = new Map(rows.map((row) => [row.id, row]));
  const rowsByCatalog = new Map(rows.filter((row) => row.catalog_slug).map((row) => [row.catalog_slug as string, row]));
  const supabase = await createClient();
  const baseDate = new Date();
  let addedDifficultCount = 0;
  let masteredCount = 0;

  for (const answer of uniqueAnswers) {
    const catalogWord = resolveCatalogFromAnswer(answer.wordId, dbCatalog);
    const row = catalogWord ? rowsByCatalog.get(catalogWord.id) ?? null : rowsById.get(answer.wordId) ?? null;
    const update = buildUpdateForAnswer(row, answer, baseDate);
    if (update.addedDifficult) addedDifficultCount += 1;
    if (update.mastered && row?.status !== "mastered") masteredCount += 1;

    const mutation = {
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

    let progressId = row?.id ?? null;
    if (row) {
      const { error } = await supabase.from("student_words").update(mutation).eq("id", row.id).eq("student_id", profile.studentId);
      if (error) throw error;
    } else if (catalogWord) {
      const { data, error } = await supabase
        .from("student_words")
        .insert({
          student_id: profile.studentId,
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
        })
        .select("id")
        .single();
      if (error) throw error;
      progressId = data?.id ?? null;
    }

    if (progressId) {
      await supabase.from("student_word_reviews").insert({
        student_word_id: progressId,
        student_id: profile.studentId,
        result: answer.result === "known" ? "good" : answer.result === "hard" ? "hard" : "again",
        reviewed_at: nowIso()
      });
    }
  }

  return {
    totalWords: uniqueAnswers.length,
    knownCount: answers.filter((answer) => answer.result === "known").length,
    hardCount: answers.filter((answer) => answer.result === "hard").length,
    unknownCount: answers.filter((answer) => answer.result === "unknown").length,
    addedDifficultCount,
    masteredCount
  };
}
