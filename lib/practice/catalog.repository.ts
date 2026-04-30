import { createClient } from "@/lib/supabase/server";

export type PracticeCatalogRepositoryClient = Awaited<ReturnType<typeof createClient>>;

export type PracticeCatalogTestRow = {
  id: string;
  module_id: string | null;
  title: string | null;
  description: string | null;
  time_limit_minutes?: number | null;
  activity_type?: string | null;
  assessment_kind?: string | null;
  cefr_level?: string | null;
  drill_topic_key?: string | null;
  drill_kind?: string | null;
  lesson_reinforcement?: boolean | null;
  sort_order?: number | null;
};

export type PracticeCatalogAttemptRow = {
  test_id: string | null;
  status: string | null;
  score: number | null;
};

const PRACTICE_CATALOG_TEST_SELECT =
  "id, module_id, title, description, time_limit_minutes, activity_type, assessment_kind, cefr_level, drill_topic_key, drill_kind, lesson_reinforcement, sort_order";

export function createPracticeCatalogRepository(client: PracticeCatalogRepositoryClient) {
  return {
    async loadAssignedCatalogTests(testIds: string[]) {
      return await client
        .from("tests")
        .select(PRACTICE_CATALOG_TEST_SELECT)
        .in("id", testIds)
        .neq("assessment_kind", "placement")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
    },

    async loadPublishedCatalogTests(params: { filter: "all" | "trainers" | "tests"; englishLevel: string | null }) {
      let query = client
        .from("tests")
        .select(PRACTICE_CATALOG_TEST_SELECT)
        .eq("is_published", true)
        .neq("assessment_kind", "placement")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(48);

      if (params.englishLevel) {
        query = query.eq("cefr_level", params.englishLevel);
      }
      if (params.filter === "trainers") {
        query = query.eq("activity_type", "trainer");
      }
      if (params.filter === "tests") {
        query = query.eq("activity_type", "test");
      }

      return await query;
    },

    async loadStudentAttempts(studentId: string, testIds?: string[]) {
      let query = client
        .from("student_test_attempts")
        .select("test_id, status, score")
        .eq("student_id", studentId);

      if (testIds) {
        query = query.in("test_id", testIds);
      } else {
        query = query.order("created_at", { ascending: false });
      }

      return await query;
    }
  };
}
