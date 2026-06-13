import type { WordSet, WordTopic } from "@/lib/words/catalog";
import type { WordSessionMode } from "@/lib/words/validation";

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

export type WordProgressMutation = {
  status: WordProgressStatus;
  next_review_at: string;
  last_reviewed_at: string;
  interval_days: number;
  review_count: number;
  known_streak: number;
  hard_count: number;
  unknown_count: number;
  difficult_marked_at: string | null;
};

export type WordReviewUpdate = WordProgressMutation & {
  addedDifficult: boolean;
  mastered: boolean;
};

