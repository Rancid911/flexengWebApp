import type { WordSessionAnswer, WordSessionParams } from "@/lib/words/validation";
import type { StudentWordRow, WordCard, WordReviewUpdate } from "@/lib/words/words.types";

export function isWordDueForReview(
  word: Pick<WordCard, "status" | "nextReviewAt">,
  now = new Date()
) {
  if (word.status === "mastered") return false;
  if (word.status === "new") return false;
  if (!word.nextReviewAt) return true;
  return new Date(word.nextReviewAt).getTime() <= now.getTime();
}

export function sortWordCardsForSession(cards: WordCard[]) {
  return [...cards].sort((left, right) => {
    const leftDate = left.nextReviewAt ? new Date(left.nextReviewAt).getTime() : 0;
    const rightDate = right.nextReviewAt ? new Date(right.nextReviewAt).getTime() : 0;
    if (leftDate !== rightDate) return leftDate - rightDate;
    return left.term.localeCompare(right.term);
  });
}

export function filterWordSessionCards(cards: WordCard[], params: WordSessionParams) {
  const scopedCards = cards.filter((card) => {
    if (params.topicSlug && card.topicSlug !== params.topicSlug) return false;
    if (params.setSlug && card.setSlug !== params.setSlug) return false;
    return true;
  });

  if (params.mode === "new") {
    return scopedCards.filter((card) => card.status === "new");
  }

  if (params.mode === "review") {
    return scopedCards.filter((card) => isWordDueForReview(card));
  }

  if (params.mode === "difficult") {
    return scopedCards.filter((card) => card.status === "difficult");
  }

  const dueCards = scopedCards.filter((card) => isWordDueForReview(card));
  const newCards = scopedCards.filter((card) => card.status === "new").slice(0, 5);
  const usedIds = new Set(dueCards.map((card) => card.id));
  return [...dueCards, ...newCards.filter((card) => !usedIds.has(card.id))];
}

export function aggregateWordSessionAnswers(answers: WordSessionAnswer[]) {
  const answersByWordId = new Map<string, WordSessionAnswer>();

  for (const answer of answers) {
    const current = answersByWordId.get(answer.wordId);
    if (!current) {
      answersByWordId.set(answer.wordId, answer);
      continue;
    }

    const result =
      current.result === "unknown" || answer.result === "unknown"
        ? "unknown"
        : current.result === "hard" || answer.result === "hard"
          ? "hard"
          : "known";

    answersByWordId.set(answer.wordId, {
      wordId: answer.wordId,
      result,
      markedDifficult: current.markedDifficult || answer.markedDifficult
    });
  }

  return [...answersByWordId.values()];
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000).toISOString();
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function buildWordReviewUpdate(
  row: StudentWordRow | null,
  answer: WordSessionAnswer,
  baseDate: Date
): WordReviewUpdate {
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
      difficult_marked_at: markedDifficult
        ? row?.difficult_marked_at ?? baseDate.toISOString()
        : row?.difficult_marked_at ?? null,
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

