import type { createClient } from "@/lib/supabase/server";

export const TEST_BASE_SELECT =
  "id, lesson_id, module_id, activity_type, assessment_kind, title, description, cefr_level, drill_topic_key, drill_kind, scoring_profile, lesson_reinforcement, sort_order, passing_score, time_limit_minutes, is_published, created_at, updated_at";

export const TEST_DETAIL_SELECT =
  `${TEST_BASE_SELECT}, test_questions(id, prompt, explanation, question_type, placement_band, sort_order, test_question_options(id, option_text, is_correct, sort_order))`;

export type AdminTestRepositoryClient = Awaited<ReturnType<typeof createClient>>;

export function createAdminTestRepository(client: AdminTestRepositoryClient) {
  return {
    async list(q?: string) {
      let query = client
        .from("tests")
        .select(TEST_BASE_SELECT)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (q) {
        query = query.or(
          `title.ilike.%${q}%,description.ilike.%${q}%,drill_topic_key.ilike.%${q}%,cefr_level.ilike.%${q}%,activity_type.ilike.%${q}%,assessment_kind.ilike.%${q}%`
        );
      }

      return await query;
    },

    async loadNextSortOrder() {
      return await client.from("tests").select("sort_order").order("sort_order", { ascending: false }).limit(1);
    },

    async loadDetail(id: string) {
      return await client.from("tests").select(TEST_DETAIL_SELECT).eq("id", id).single();
    },

    async loadRaw(id: string) {
      return await client.from("tests").select(TEST_BASE_SELECT).eq("id", id).single();
    },

    async hasAttempts(testId: string) {
      return await client.from("student_test_attempts").select("id", { count: "exact", head: true }).eq("test_id", testId);
    },

    async createTest(payload: Record<string, unknown>) {
      return await client.from("tests").insert(payload).select(TEST_BASE_SELECT).single();
    },

    async updateTest(id: string, patch: Record<string, unknown>) {
      return await client.from("tests").update(patch).eq("id", id);
    },

    async deleteTest(id: string) {
      return await client.from("tests").delete().eq("id", id);
    },

    async createQuestion(payload: Record<string, unknown>) {
      return await client.from("test_questions").insert(payload).select("id").single();
    },

    async updateQuestion(id: string, payload: Record<string, unknown>) {
      return await client.from("test_questions").update(payload).eq("id", id);
    },

    async createOption(payload: Record<string, unknown>) {
      return await client.from("test_question_options").insert(payload);
    },

    async insertOptions(payload: Array<Record<string, unknown>>) {
      return await client.from("test_question_options").insert(payload);
    },

    async updateOption(id: string, payload: Record<string, unknown>) {
      return await client.from("test_question_options").update(payload).eq("id", id);
    },

    async deleteOptions(ids: string[]) {
      return await client.from("test_question_options").delete().in("id", ids);
    },

    async deleteQuestions(ids: string[]) {
      return await client.from("test_questions").delete().in("id", ids);
    }
  };
}
