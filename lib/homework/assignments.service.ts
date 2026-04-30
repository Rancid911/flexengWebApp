import { ScheduleHttpError } from "@/lib/schedule/http";
import { createHomeworkAssignmentsRepository, type HomeworkAssignmentsRepositoryClient } from "@/lib/homework/assignments.repository";
import type { HomeworkAssignmentRow } from "@/lib/homework/assignments.mappers";

export type HomeworkAssignmentInput = {
  studentId: string;
  assignedByProfileId: string;
  scheduleLessonId?: string | null;
  title: string;
  description?: string | null;
  dueAt?: string | null;
  activityIds: string[];
};

function buildAssignmentPayload(input: HomeworkAssignmentInput) {
  return {
    student_id: input.studentId,
    assigned_by_profile_id: input.assignedByProfileId,
    schedule_lesson_id: input.scheduleLessonId ?? null,
    title: input.title,
    description: input.description?.trim() || null,
    due_at: input.dueAt || null,
    status: "not_started"
  };
}

function buildItemPayload(assignmentId: string, activityIds: string[]) {
  return activityIds.map((activityId, index) => ({
    assignment_id: assignmentId,
    source_type: "test",
    source_id: activityId,
    sort_order: index,
    required: true
  }));
}

export function buildAssignmentWithItems(assignment: HomeworkAssignmentRow, activityIds: string[]): HomeworkAssignmentRow {
  return {
    ...assignment,
    homework_items: activityIds.map((activityId, index) => ({
      id: "",
      source_type: "test",
      source_id: activityId,
      sort_order: index,
      required: true
    }))
  };
}

export async function createStandaloneHomeworkAssignment(input: HomeworkAssignmentInput, client?: HomeworkAssignmentsRepositoryClient) {
  const repository = createHomeworkAssignmentsRepository(client);
  const assignmentResponse = await repository.createAssignment(buildAssignmentPayload({ ...input, scheduleLessonId: null }));
  if (assignmentResponse.error || !assignmentResponse.data) {
    throw new ScheduleHttpError(500, "HOMEWORK_ASSIGN_FAILED", "Failed to create standalone homework assignment", assignmentResponse.error?.message);
  }

  const assignmentId = String(assignmentResponse.data.id);
  const itemsResponse = await repository.insertItems(buildItemPayload(assignmentId, input.activityIds));
  if (itemsResponse.error) {
    throw new ScheduleHttpError(500, "HOMEWORK_ASSIGN_FAILED", "Failed to attach standalone homework activities", itemsResponse.error.message);
  }

  return buildAssignmentWithItems(assignmentResponse.data as HomeworkAssignmentRow, input.activityIds);
}

export async function upsertLessonLinkedHomeworkAssignment(input: HomeworkAssignmentInput, client?: HomeworkAssignmentsRepositoryClient) {
  const repository = createHomeworkAssignmentsRepository(client);
  const existingResponse = await repository.loadLinkedLessonAssignmentId(input.scheduleLessonId ?? "", input.studentId);
  if (existingResponse.error) {
    throw new ScheduleHttpError(500, "HOMEWORK_ASSIGN_FAILED", "Failed to load linked homework assignment", existingResponse.error.message);
  }

  const assignmentPayload = buildAssignmentPayload(input);
  let assignmentId = existingResponse.data?.id ? String(existingResponse.data.id) : null;
  if (assignmentId) {
    const updateResponse = await repository.updateAssignment(assignmentId, assignmentPayload);
    if (updateResponse.error) {
      throw new ScheduleHttpError(500, "HOMEWORK_ASSIGN_FAILED", "Failed to update homework assignment", updateResponse.error.message);
    }
    assignmentId = String(updateResponse.data.id);

    const deleteItemsResponse = await repository.deleteItemsByAssignmentId(assignmentId);
    if (deleteItemsResponse.error) {
      throw new ScheduleHttpError(500, "HOMEWORK_ASSIGN_FAILED", "Failed to reset homework items", deleteItemsResponse.error.message);
    }
  } else {
    const insertResponse = await repository.createAssignment(assignmentPayload);
    if (insertResponse.error) {
      throw new ScheduleHttpError(500, "HOMEWORK_ASSIGN_FAILED", "Failed to create homework assignment", insertResponse.error.message);
    }
    assignmentId = String(insertResponse.data.id);
  }

  if (input.activityIds.length > 0) {
    const itemsResponse = await repository.insertItems(buildItemPayload(assignmentId, input.activityIds));
    if (itemsResponse.error) {
      throw new ScheduleHttpError(500, "HOMEWORK_ASSIGN_FAILED", "Failed to attach homework activities", itemsResponse.error.message);
    }
  }

  return assignmentId;
}

export async function createPlacementHomeworkAssignment(input: HomeworkAssignmentInput, client?: HomeworkAssignmentsRepositoryClient) {
  const repository = createHomeworkAssignmentsRepository(client);
  const assignmentResponse = await repository.createAssignment(buildAssignmentPayload({ ...input, scheduleLessonId: null }));
  if (assignmentResponse.error || !assignmentResponse.data) {
    throw new ScheduleHttpError(500, "PLACEMENT_ASSIGN_FAILED", "Failed to create placement assignment", assignmentResponse.error?.message);
  }

  const assignmentId = String(assignmentResponse.data.id);
  const itemResponse = await repository.insertItems(buildItemPayload(assignmentId, input.activityIds)[0]);
  if (itemResponse.error) {
    throw new ScheduleHttpError(500, "PLACEMENT_ASSIGN_FAILED", "Failed to attach placement test", itemResponse.error.message);
  }

  return buildAssignmentWithItems(assignmentResponse.data as HomeworkAssignmentRow, input.activityIds);
}

export async function deleteHomeworkAssignment(id: string, errorCode: string, errorMessage: string, client?: HomeworkAssignmentsRepositoryClient) {
  const repository = createHomeworkAssignmentsRepository(client);
  const response = await repository.deleteAssignment(id);
  if (response.error) {
    throw new ScheduleHttpError(500, errorCode, errorMessage, response.error.message);
  }
}

export async function syncHomeworkProgressForCompletedTest(studentId: string, testId: string, completedAtIso: string, startedAtIso: string) {
  const repository = createHomeworkAssignmentsRepository();
  const assignmentsResponse = await repository.listAssignmentIdsByStudent(studentId);
  const assignmentIds = (assignmentsResponse.data ?? []).map((row) => String(row.id));
  if (assignmentIds.length === 0) return;

  const itemsResponse = await repository.listMatchingTestItems(assignmentIds, testId);
  const matchingItems = (itemsResponse.data ?? []) as Array<{ id: string; assignment_id: string; required: boolean }>;
  if (matchingItems.length === 0) return;

  await repository.upsertProgressRows(
    matchingItems.map((item) => ({
      assignment_id: item.assignment_id,
      homework_item_id: item.id,
      student_id: studentId,
      status: "completed",
      started_at: startedAtIso,
      completed_at: completedAtIso
    }))
  );

  const affectedAssignmentIds = Array.from(new Set(matchingItems.map((item) => item.assignment_id)));
  const [allItemsResponse, progressResponse] = await Promise.all([
    repository.loadItemsByAssignmentIds(affectedAssignmentIds),
    repository.loadProgressByAssignmentIds(studentId, affectedAssignmentIds)
  ]);

  const allItems = (allItemsResponse.data ?? []) as Array<{ id: string; assignment_id: string; required: boolean }>;
  const progressRows = (progressResponse.data ?? []) as Array<{ homework_item_id: string; assignment_id: string; status: string | null }>;
  const progressByAssignment = new Map<string, Map<string, string>>();
  for (const row of progressRows) {
    const assignmentMap = progressByAssignment.get(row.assignment_id) ?? new Map<string, string>();
    assignmentMap.set(row.homework_item_id, row.status ?? "not_started");
    progressByAssignment.set(row.assignment_id, assignmentMap);
  }

  for (const assignmentId of affectedAssignmentIds) {
    const assignmentItems = allItems.filter((item) => item.assignment_id === assignmentId);
    const requiredItems = assignmentItems.filter((item) => item.required);
    const assignmentProgress = progressByAssignment.get(assignmentId) ?? new Map<string, string>();
    const allRequiredCompleted = requiredItems.length > 0 && requiredItems.every((item) => assignmentProgress.get(item.id) === "completed");
    await repository.updateAssignmentCompletionStatus(studentId, assignmentId, allRequiredCompleted ? "completed" : "in_progress", allRequiredCompleted ? completedAtIso : null);
  }
}
