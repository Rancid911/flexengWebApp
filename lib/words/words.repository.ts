import { createClient } from "@/lib/supabase/server";
import type { WordProgressMutation } from "@/lib/words/words.types";

export type WordsRepositoryClient = Awaited<ReturnType<typeof createClient>>;

const STUDENT_WORD_SELECT =
  "id, term, translation, source_type, source_entity_id, status, next_review_at, last_reviewed_at, ease_factor, interval_days, review_count, topic_slug, topic_title, example_sentence, example_translation, catalog_slug, known_streak, hard_count, unknown_count, difficult_marked_at, created_at";

export function createWordsRepository(client: WordsRepositoryClient) {
  return {
    loadPublishedWordCardSets() {
      return client
        .from("word_card_sets")
        .select(
          "id, title, description, topic_slug, topic_title, cefr_level, sort_order, word_card_items(id, term, translation, example_sentence, example_translation, sort_order)"
        )
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
    },

    loadStudentWords(studentId: string) {
      return client
        .from("student_words")
        .select(STUDENT_WORD_SELECT)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });
    },

    loadPublishedCatalogItems(itemIds: string[]) {
      return client
        .from("word_card_items")
        .select(
          "id, term, translation, example_sentence, example_translation, sort_order, word_card_sets!inner(id, title, description, topic_slug, topic_title, cefr_level, is_published)"
        )
        .in("id", itemIds)
        .eq("word_card_sets.is_published", true);
    },

    loadStudentWordsByIds(studentId: string, wordIds: string[]) {
      return client
        .from("student_words")
        .select(STUDENT_WORD_SELECT)
        .eq("student_id", studentId)
        .in("id", wordIds);
    },

    loadStudentWordsByCatalogSlugs(studentId: string, catalogSlugs: string[]) {
      return client
        .from("student_words")
        .select(STUDENT_WORD_SELECT)
        .eq("student_id", studentId)
        .in("catalog_slug", catalogSlugs);
    },

    updateStudentWord(studentId: string, wordId: string, mutation: WordProgressMutation) {
      return client
        .from("student_words")
        .update(mutation)
        .eq("id", wordId)
        .eq("student_id", studentId);
    },

    insertStudentWord(
      payload: WordProgressMutation & {
        student_id: string;
        term: string;
        translation: string;
        source_type: "manual";
        source_entity_id: null;
        topic_slug: string;
        topic_title: string;
        example_sentence: string;
        example_translation: string;
        catalog_slug: string;
      }
    ) {
      return client.from("student_words").insert(payload).select("id").single();
    },

    insertWordReview(payload: {
      student_word_id: string;
      student_id: string;
      result: "good" | "hard" | "again";
      reviewed_at: string;
    }) {
      return client.from("student_word_reviews").insert(payload);
    }
  };
}

export async function createUserScopedWordsRepository() {
  return createWordsRepository(await createClient());
}
