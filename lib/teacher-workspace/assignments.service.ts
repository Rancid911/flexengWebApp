import { revalidatePath } from "next/cache";
import type { HomeworkAssignmentRow, HomeworkAttemptSummaryRow, HomeworkProgressRow } from "@/lib/homework/assignments.mappers";
import {
  createPlacementHomeworkAssignment,
  createStandaloneHomeworkAssignment,
  deleteHomeworkAssignment
} from "@/lib/homework/assignments.service";
import {
  assertScheduleWriteAccess,
  assertTeacherScope,
  isTeacherScheduleActor,
  type ScheduleActor
} from "@/lib/schedule/server";
import { ScheduleHttpError } from "@/lib/schedule/http";
import { assertTeacherWorkspaceWriteAccess } from "@/lib/teacher-workspace/access";
import { listTeacherAssignableTests } from "@/lib/teacher-workspace/lesson-followup.service";
import {
  buildPlacementSummaryFromHomework,
  buildTeacherHomeworkAssignmentDtos,
  mapPlacementStatus,
  type TeacherHomeworkTestMetadata
} from "@/lib/teacher-workspace/student-profile.mappers";
import { loadTeacherStudentCore } from "@/lib/teacher-workspace/student-profile.queries";
import { createTeacherStudentProfileRepository } from "@/lib/teacher-workspace/student-profile.repository";
import type {
  TeacherStandaloneHomeworkCreatePayload,
  TeacherStudentHomeworkDto,
  TeacherStudentPlacementSummaryDto
} from "@/lib/teacher-workspace/types";

export { listTeacherStudentStandaloneHomework } from "@/lib/teacher-workspace/student-profile.queries";

function isTeacherScopedActor(actor: ScheduleActor) {
  return isTeacherScheduleActor(actor) && actor.accessibleStudentIds !== null;
}

async function enrichTeacherHomeworkAssignments(
  studentId: string,
  assignments: HomeworkAssignmentRow[],
  repository = createTeacherStudentProfileRepository()
): Promise<TeacherStudentHomeworkDto[]> {
  const allItems = assignments.flatMap((assignment) => assignment.homework_items ?? []);
  const itemIds = allItems.map((item) => String(item.id));
  const testIds = Array.from(
    new Set(
      allItems
        .filter((item) => item.source_type === "test" && item.source_id)
        .map((item) => String(item.source_id))
    )
  );

  const [testsResponse, progressResponse, attemptsResponse] = await Promise.all([
    testIds.length > 0 ? repository.loadTestsForTeacherHomework(testIds) : Promise.resolve({ data: [], error: null }),
    itemIds.length > 0 ? repository.loadProgressByItemIds(studentId, itemIds) : Promise.resolve({ data: [], error: null }),
    testIds.length > 0 ? repository.loadLatestAttemptsByTestIds(studentId, testIds) : Promise.resolve({ data: [], error: null })
  ]);

  if (testsResponse.error) {
    throw new ScheduleHttpError(500, "TEACHER_STUDENT_FAILED", "Failed to load homework tests", testsResponse.error.message);
  }
  if (progressResponse.error) {
    throw new ScheduleHttpError(500, "TEACHER_STUDENT_FAILED", "Failed to load homework progress", progressResponse.error.message);
  }
  if (attemptsResponse.error) {
    throw new ScheduleHttpError(500, "TEACHER_STUDENT_FAILED", "Failed to load homework attempts", attemptsResponse.error.message);
  }

  return buildTeacherHomeworkAssignmentDtos({
    assignments,
    tests: (testsResponse.data ?? []) as TeacherHomeworkTestMetadata[],
    progressRows: (progressResponse.data ?? []) as HomeworkProgressRow[],
    attemptRows: (attemptsResponse.data ?? []) as HomeworkAttemptSummaryRow[]
  });
}

async function resolveCanonicalPlacementTest(repository = createTeacherStudentProfileRepository()) {
  const response = await repository.resolveCanonicalPlacementTest();
  if (response.error) {
    throw new ScheduleHttpError(500, "PLACEMENT_TEST_LOOKUP_FAILED", "Failed to load placement test", response.error.message);
  }

  return response.data ? { id: String(response.data.id), title: String(response.data.title ?? "Placement Test") } : null;
}

export async function assignTeacherStudentPlacementTest(actor: ScheduleActor, studentId: string): Promise<TeacherStudentPlacementSummaryDto> {
  assertScheduleWriteAccess(actor);
  if (isTeacherScopedActor(actor)) {
    assertTeacherScope(actor, { studentId });
  }

  await loadTeacherStudentCore(actor, studentId);
  const repository = createTeacherStudentProfileRepository();
  const canonicalPlacement = await resolveCanonicalPlacementTest(repository);
  if (!canonicalPlacement) {
    throw new ScheduleHttpError(409, "PLACEMENT_TEST_NOT_CONFIGURED", "Placement test is not configured");
  }

  const existingResponse = await repository.listPlacementAssignments(studentId, canonicalPlacement.id);

  if (existingResponse.error) {
    throw new ScheduleHttpError(500, "PLACEMENT_ASSIGN_FAILED", "Failed to load existing placement assignments", existingResponse.error.message);
  }

  const existingAssignments = (existingResponse.data ?? []) as HomeworkAssignmentRow[];
  const unfinishedAssignment =
    existingAssignments.find((assignment) => assignment.status === "not_started" || assignment.status === "in_progress" || assignment.status === "overdue") ?? null;

  if (unfinishedAssignment) {
    const [enriched] = await enrichTeacherHomeworkAssignments(studentId, [unfinishedAssignment], repository);
    revalidatePath(`/students/${studentId}`);
    const summary = buildPlacementSummaryFromHomework(enriched ?? null);
    return summary?.testId
      ? summary
      : {
          assignmentId: unfinishedAssignment.id,
          status: mapPlacementStatus(unfinishedAssignment.status),
          testId: canonicalPlacement.id,
          title: canonicalPlacement.title,
          attemptId: null,
          score: null,
          recommendedLevel: null,
          recommendedBandLabel: null,
          submittedAt: null
        };
  }

  const createdAssignment = await createPlacementHomeworkAssignment(
    {
      studentId,
      assignedByProfileId: actor.userId,
      title: "Placement Test",
      description: "Диагностический тест для определения рекомендуемого уровня.",
      dueAt: null,
      activityIds: [canonicalPlacement.id]
    },
    repository.client
  );

  const [enriched] = await enrichTeacherHomeworkAssignments(studentId, [createdAssignment], repository);
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/schedule");
  const summary = buildPlacementSummaryFromHomework(enriched ?? null);
  return summary?.testId
    ? summary
    : {
        assignmentId: createdAssignment.id,
        status: "not_started",
        testId: canonicalPlacement.id,
        title: canonicalPlacement.title,
        attemptId: null,
        score: null,
        recommendedLevel: null,
        recommendedBandLabel: null,
        submittedAt: null
      };
}

export async function cancelTeacherStudentPlacementTest(actor: ScheduleActor, studentId: string): Promise<TeacherStudentPlacementSummaryDto> {
  assertScheduleWriteAccess(actor);
  if (isTeacherScopedActor(actor)) {
    assertTeacherScope(actor, { studentId });
  }

  await loadTeacherStudentCore(actor, studentId);
  const repository = createTeacherStudentProfileRepository();
  const canonicalPlacement = await resolveCanonicalPlacementTest(repository);
  if (!canonicalPlacement) {
    return {
      assignmentId: null,
      status: "not_assigned",
      testId: null,
      title: null,
      attemptId: null,
      score: null,
      recommendedLevel: null,
      recommendedBandLabel: null,
      submittedAt: null
    };
  }

  const existingResponse = await repository.listPlacementAssignments(studentId, canonicalPlacement.id, true);

  if (existingResponse.error) {
    throw new ScheduleHttpError(500, "PLACEMENT_CANCEL_FAILED", "Failed to load placement assignment", existingResponse.error.message);
  }

  const [activeAssignment] = (existingResponse.data ?? []) as Array<{ id: string }>;
  if (activeAssignment?.id) {
    await deleteHomeworkAssignment(activeAssignment.id, "PLACEMENT_CANCEL_FAILED", "Failed to cancel placement assignment", repository.client);
  }

  revalidatePath(`/students/${studentId}`);
  revalidatePath("/schedule");

  return {
    assignmentId: null,
    status: "not_assigned",
    testId: canonicalPlacement.id,
    title: canonicalPlacement.title,
    attemptId: null,
    score: null,
    recommendedLevel: null,
    recommendedBandLabel: null,
    submittedAt: null
  };
}

export async function createTeacherStudentStandaloneHomework(
  actor: ScheduleActor,
  studentId: string,
  payload: TeacherStandaloneHomeworkCreatePayload
): Promise<TeacherStudentHomeworkDto> {
  assertScheduleWriteAccess(actor);
  assertTeacherWorkspaceWriteAccess(actor);
  if (isTeacherScopedActor(actor)) {
    assertTeacherScope(actor, { studentId });
  }

  await loadTeacherStudentCore(actor, studentId);

  const normalizedActivityIds = Array.from(new Set(payload.activityIds.filter(Boolean)));
  if (normalizedActivityIds.length === 0) {
    throw new ScheduleHttpError(400, "VALIDATION_ERROR", "Нужно выбрать хотя бы одну активность для homework.");
  }

  const assignableOptions = await listTeacherAssignableTests(actor, studentId);
  const assignableById = new Map(
    assignableOptions.filter((option) => option.assessmentKind !== "placement").map((option) => [option.id, option] as const)
  );
  const hasInvalidActivities = normalizedActivityIds.some((activityId) => !assignableById.has(activityId));
  if (hasInvalidActivities) {
    throw new ScheduleHttpError(400, "VALIDATION_ERROR", "Выбраны недоступные активности для homework.");
  }

  const derivedTitle =
    payload.title?.trim() ||
    (normalizedActivityIds.length === 1
      ? assignableById.get(normalizedActivityIds[0])?.title ?? "Домашнее задание"
      : `Домашнее задание · ${normalizedActivityIds.length} задания`);

  const repository = createTeacherStudentProfileRepository();
  const createdAssignment = await createStandaloneHomeworkAssignment(
    {
      studentId,
      assignedByProfileId: actor.userId,
      title: derivedTitle,
      description: payload.description?.trim() || null,
      dueAt: payload.dueAt || null,
      activityIds: normalizedActivityIds
    },
    repository.client
  );

  const [enriched] = await enrichTeacherHomeworkAssignments(studentId, [createdAssignment], repository);
  if (!enriched) {
    throw new ScheduleHttpError(500, "HOMEWORK_ASSIGN_FAILED", "Failed to load created standalone homework assignment");
  }

  revalidatePath(`/students/${studentId}`);
  revalidatePath("/dashboard");
  revalidatePath("/homework");

  return enriched;
}
