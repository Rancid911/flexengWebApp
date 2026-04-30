import { createAdminClient } from "@/lib/supabase/admin";

export type HomeworkAssignmentsRepositoryClient = ReturnType<typeof createAdminClient>;

const HOMEWORK_ASSIGNMENT_SELECT = "id, title, description, status, due_at, completed_at, created_at, schedule_lesson_id";
const HOMEWORK_ASSIGNMENT_WITH_ITEMS_SELECT = `${HOMEWORK_ASSIGNMENT_SELECT}, homework_items(id, source_type, source_id, sort_order, required)`;
const HOMEWORK_ASSIGNMENT_WITH_INNER_ITEMS_SELECT = `${HOMEWORK_ASSIGNMENT_SELECT}, homework_items!inner(id, source_type, source_id, sort_order, required)`;
const ACTIVE_HOMEWORK_STATUSES = ["not_started", "in_progress", "overdue"];

export function createHomeworkAssignmentsRepository(client: HomeworkAssignmentsRepositoryClient = createAdminClient()) {
  return {
    async listAssignmentsByStudent(studentId: string, status?: "active" | "completed" | "overdue") {
      let query = client
        .from("homework_assignments")
        .select("id, title, description, status, due_at, homework_items(id, source_type, source_id, required)")
        .eq("student_id", studentId)
        .order("due_at", { ascending: true });

      if (status === "active") query = query.in("status", ["not_started", "in_progress"]);
      if (status === "completed") query = query.eq("status", "completed");
      if (status === "overdue") query = query.eq("status", "overdue");

      return await query;
    },

    async loadAssignmentDetail(studentId: string, assignmentId: string) {
      return await client
        .from("homework_assignments")
        .select("id, title, description, status, due_at, completed_at, homework_items(id, source_type, source_id, sort_order, required)")
        .eq("student_id", studentId)
        .eq("id", assignmentId)
        .maybeSingle();
    },

    async loadTestsAssessment(testIds: string[]) {
      return await client.from("tests").select("id, assessment_kind").in("id", testIds);
    },

    async loadTestsDetail(testIds: string[]) {
      return await client.from("tests").select("id, title, activity_type, assessment_kind, cefr_level, drill_topic_key").in("id", testIds);
    },

    async loadTestsForTeacherHomework(testIds: string[]) {
      return await client.from("tests").select("id, title, activity_type, assessment_kind").in("id", testIds);
    },

    async loadProgressByItemIds(studentId: string, homeworkItemIds: string[]) {
      return await client.from("student_homework_progress").select("homework_item_id, status").eq("student_id", studentId).in("homework_item_id", homeworkItemIds);
    },

    async loadProgressByAssignmentIds(studentId: string, assignmentIds: string[]) {
      return await client
        .from("student_homework_progress")
        .select("homework_item_id, assignment_id, status")
        .eq("student_id", studentId)
        .in("assignment_id", assignmentIds);
    },

    async loadLatestAttemptsByTestIds(studentId: string, testIds: string[]) {
      return await client
        .from("student_test_attempts")
        .select("test_id, score, submitted_at, recommended_level, recommended_band_label, placement_summary")
        .eq("student_id", studentId)
        .in("test_id", testIds)
        .not("submitted_at", "is", null)
        .order("submitted_at", { ascending: false });
    },

    async listHomeworkSnapshot(studentId: string, limit: number) {
      return await client
        .from("homework_assignments")
        .select(HOMEWORK_ASSIGNMENT_WITH_INNER_ITEMS_SELECT)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(limit);
    },

    async listActiveAssignedTestItems(studentId: string) {
      return await client
        .from("homework_assignments")
        .select("homework_items!inner(source_type, source_id)")
        .eq("student_id", studentId)
        .in("status", ACTIVE_HOMEWORK_STATUSES);
    },

    async listSearchAssignedHomeworkItems(studentId: string) {
      return await client
        .from("homework_assignments")
        .select("homework_items!inner(source_type, source_id)")
        .eq("student_id", studentId)
        .in("status", ACTIVE_HOMEWORK_STATUSES);
    },

    async loadStudentDashboardPlacementAssignment(studentId: string, placementTestId: string) {
      return await client
        .from("homework_assignments")
        .select("id, status, homework_items!inner(id, source_type, source_id)")
        .eq("student_id", studentId)
        .eq("homework_items.source_type", "test")
        .eq("homework_items.source_id", placementTestId)
        .order("created_at", { ascending: false })
        .limit(1);
    },

    async listStudentDashboardActiveHomework(studentId: string) {
      return await client
        .from("homework_assignments")
        .select("id, title, status, due_at, homework_items(id, source_type, source_id)")
        .eq("student_id", studentId)
        .in("status", ACTIVE_HOMEWORK_STATUSES)
        .order("due_at", { ascending: true });
    },

    async loadLinkedLessonAssignment(lessonId: string, studentId: string) {
      return await client
        .from("homework_assignments")
        .select(HOMEWORK_ASSIGNMENT_WITH_ITEMS_SELECT)
        .eq("schedule_lesson_id", lessonId)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
    },

    async loadLinkedLessonAssignmentId(lessonId: string, studentId: string) {
      return await client
        .from("homework_assignments")
        .select("id")
        .eq("schedule_lesson_id", lessonId)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
    },

    async listPlacementAssignments(studentId: string, testId: string, activeOnly = false) {
      let query = client
        .from("homework_assignments")
        .select(HOMEWORK_ASSIGNMENT_WITH_INNER_ITEMS_SELECT)
        .eq("student_id", studentId)
        .eq("homework_items.source_type", "test")
        .eq("homework_items.source_id", testId)
        .order("created_at", { ascending: false });

      if (activeOnly) query = query.in("status", ACTIVE_HOMEWORK_STATUSES);

      return await query.limit(activeOnly ? 1 : 10);
    },

    async createAssignment(payload: Record<string, unknown>) {
      return await client.from("homework_assignments").insert(payload).select(HOMEWORK_ASSIGNMENT_SELECT).single();
    },

    async updateAssignment(id: string, payload: Record<string, unknown>) {
      return await client.from("homework_assignments").update(payload).eq("id", id).select("id").single();
    },

    async deleteAssignment(id: string) {
      return await client.from("homework_assignments").delete().eq("id", id);
    },

    async deleteItemsByAssignmentId(assignmentId: string) {
      return await client.from("homework_items").delete().eq("assignment_id", assignmentId);
    },

    async insertItems(items: Array<Record<string, unknown>> | Record<string, unknown>) {
      return await client.from("homework_items").insert(items);
    },

    async listAssignmentIdsByStudent(studentId: string) {
      return await client.from("homework_assignments").select("id").eq("student_id", studentId);
    },

    async listMatchingTestItems(assignmentIds: string[], testId: string) {
      return await client
        .from("homework_items")
        .select("id, assignment_id, required")
        .in("assignment_id", assignmentIds)
        .eq("source_type", "test")
        .eq("source_id", testId);
    },

    async loadItemsByAssignmentIds(assignmentIds: string[]) {
      return await client.from("homework_items").select("id, assignment_id, required").in("assignment_id", assignmentIds);
    },

    async upsertProgressRows(rows: Array<Record<string, unknown>>) {
      return await client.from("student_homework_progress").upsert(rows, { onConflict: "student_id,homework_item_id" });
    },

    async updateAssignmentCompletionStatus(studentId: string, assignmentId: string, status: "completed" | "in_progress", completedAt: string | null) {
      return await client
        .from("homework_assignments")
        .update({ status, completed_at: completedAt })
        .eq("id", assignmentId)
        .eq("student_id", studentId);
    },

    async listActiveHomeworkRowsByStudentIds(studentIds: string[]) {
      return await client.from("homework_assignments").select("student_id").in("student_id", studentIds).in("status", ACTIVE_HOMEWORK_STATUSES);
    },

    async listActiveDashboardHomeworkRows(scopedStudentIds?: string[]) {
      let query = client
        .from("homework_assignments")
        .select("id, student_id, title, due_at, status")
        .in("status", ACTIVE_HOMEWORK_STATUSES)
        .order("due_at", { ascending: true });
      if (scopedStudentIds) query = query.in("student_id", scopedStudentIds);
      return await query;
    }
  };
}
