import { applyCompletedLessonCharge } from "@/lib/billing/server";
import { createHomeworkAssignmentsRepository } from "@/lib/homework/assignments.repository";
import type { HomeworkAssignmentRow, HomeworkAttemptSummaryRow, HomeworkProgressRow } from "@/lib/homework/assignments.mappers";
import { upsertLessonLinkedHomeworkAssignment } from "@/lib/homework/assignments.service";
import { defineDataLoadingDescriptor } from "@/lib/data-loading/contracts";
import { ScheduleHttpError } from "@/lib/schedule/http";
import {
  assertScheduleWriteAccess,
  assertStaffAdminCapability,
  assertTeacherCapability,
  assertTeacherScope,
  isTeacherScheduleActor,
  type ScheduleActor
} from "@/lib/schedule/server";
import type { LessonAttendanceDto, LessonOutcomeDto } from "@/lib/schedule/types";
import { hasLessonEnded } from "@/lib/schedule/utils";
import type { AccessMode } from "@/lib/supabase/access";
import { assertTeacherWorkspaceWriteAccess } from "@/lib/teacher-workspace/access";
import {
  createTeacherLessonFollowupRepository,
  type TeacherAssignableTestRow,
  type TeacherLessonAttendanceRow,
  type TeacherLessonFollowupLessonRow,
  type TeacherLessonOutcomeRow
} from "@/lib/teacher-workspace/lesson-followup.repository";
import {
  buildTeacherHomeworkAssignmentDtos,
  type TeacherHomeworkTestMetadata
} from "@/lib/teacher-workspace/student-profile.mappers";
import type {
  TeacherAssignableTestOptionDto,
  TeacherLessonFollowupDto,
  TeacherLessonFollowupPayload,
  TeacherStudentHomeworkDto
} from "@/lib/teacher-workspace/types";

const TEACHER_LESSON_FOLLOWUP_ACCESS_MODE: AccessMode = "privileged";

export const TEACHER_LESSON_FOLLOWUP_DATA_LOADING = defineDataLoadingDescriptor({
  id: "teacher-lesson-followup",
  owner: "@/lib/teacher-workspace/queries#upsertTeacherLessonFollowup",
  accessMode: TEACHER_LESSON_FOLLOWUP_ACCESS_MODE,
  loadLevel: "client_interaction",
  shape: "detail",
  issues: [],
  notes: ["Teacher-scoped follow-up interaction for attendance, outcome and post-lesson homework."]
});

function assertTeacherActor(actor: ScheduleActor) {
  try {
    assertTeacherCapability(actor);
    return;
  } catch {}

  try {
    assertStaffAdminCapability(actor);
    return;
  } catch {}

  throw new ScheduleHttpError(403, "FORBIDDEN", "Teacher workspace is not available");
}

function isTeacherScopedActor(actor: ScheduleActor) {
  return isTeacherScheduleActor(actor) && actor.accessibleStudentIds !== null;
}

function assertLessonScope(actor: ScheduleActor, lesson: TeacherLessonFollowupLessonRow) {
  assertTeacherActor(actor);
  if (isTeacherScopedActor(actor)) {
    assertTeacherScope(actor, {
      studentId: lesson.student_id,
      teacherId: lesson.teacher_id
    });
  }
}

async function getLessonById(id: string, repository = createTeacherLessonFollowupRepository()) {
  const response = await repository.loadLessonById(id);

  if (response.error) {
    throw new ScheduleHttpError(500, "SCHEDULE_FETCH_FAILED", "Failed to load schedule lesson", response.error.message);
  }

  if (!response.data) {
    throw new ScheduleHttpError(404, "SCHEDULE_NOT_FOUND", "Schedule lesson not found");
  }

  return response.data as TeacherLessonFollowupLessonRow;
}

async function enrichTeacherHomeworkAssignments(
  studentId: string,
  assignments: HomeworkAssignmentRow[],
  repository = createTeacherLessonFollowupRepository()
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

  const homeworkRepository = createHomeworkAssignmentsRepository(repository.client);
  const [testsResponse, progressResponse, attemptsResponse] = await Promise.all([
    testIds.length > 0 ? homeworkRepository.loadTestsForTeacherHomework(testIds) : Promise.resolve({ data: [], error: null }),
    itemIds.length > 0 ? homeworkRepository.loadProgressByItemIds(studentId, itemIds) : Promise.resolve({ data: [], error: null }),
    testIds.length > 0 ? homeworkRepository.loadLatestAttemptsByTestIds(studentId, testIds) : Promise.resolve({ data: [], error: null })
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

export async function getTeacherLessonFollowup(actor: ScheduleActor, lessonId: string): Promise<TeacherLessonFollowupDto> {
  const repository = createTeacherLessonFollowupRepository();
  const lesson = await getLessonById(lessonId, repository);
  assertLessonScope(actor, lesson);

  const homeworkRepository = createHomeworkAssignmentsRepository(repository.client);
  const [attendanceResponse, outcomeResponse, homeworkResponse] = await Promise.all([
    repository.loadLessonAttendance(lessonId),
    repository.loadLessonOutcome(lessonId),
    homeworkRepository.loadLinkedLessonAssignment(lessonId, lesson.student_id)
  ]);

  if (attendanceResponse.error || outcomeResponse.error || homeworkResponse.error) {
    throw new ScheduleHttpError(500, "LESSON_FOLLOWUP_FETCH_FAILED", "Failed to load lesson follow-up");
  }

  const homeworkAssignment = (homeworkResponse.data ?? null) as HomeworkAssignmentRow | null;
  const [homeworkSummary] = homeworkAssignment ? await enrichTeacherHomeworkAssignments(lesson.student_id, [homeworkAssignment], repository) : [];
  const attendance = attendanceResponse.data as TeacherLessonAttendanceRow | null;
  const outcome = outcomeResponse.data as TeacherLessonOutcomeRow | null;

  return {
    attendance: attendance
      ? ({
          id: attendance.id,
          scheduleLessonId: attendance.schedule_lesson_id,
          studentId: attendance.student_id,
          teacherId: attendance.teacher_id,
          status: attendance.status,
          markedAt: attendance.marked_at,
          createdAt: attendance.created_at,
          updatedAt: attendance.updated_at
        } satisfies LessonAttendanceDto)
      : null,
    outcome: outcome
      ? ({
          id: outcome.id,
          scheduleLessonId: outcome.schedule_lesson_id,
          studentId: outcome.student_id,
          teacherId: outcome.teacher_id,
          summary: outcome.summary,
          coveredTopics: outcome.covered_topics,
          mistakesSummary: outcome.mistakes_summary,
          nextSteps: outcome.next_steps,
          visibleToStudent: outcome.visible_to_student,
          createdAt: outcome.created_at,
          updatedAt: outcome.updated_at
        } satisfies LessonOutcomeDto)
      : null,
    homeworkAssignment: homeworkAssignment
      ? {
          id: homeworkAssignment.id,
          title: homeworkAssignment.title ?? "",
          description: homeworkAssignment.description ?? null,
          dueAt: homeworkAssignment.due_at ?? null,
          status: homeworkSummary?.status ?? homeworkAssignment.status ?? "not_started",
          completedAt: homeworkSummary?.completedAt ?? homeworkAssignment.completed_at ?? null,
          requiredCount: homeworkSummary?.requiredCount ?? 0,
          completedRequiredCount: homeworkSummary?.completedRequiredCount ?? 0,
          testIds: (homeworkAssignment.homework_items ?? [])
            .filter((item) => item.source_type === "test" && item.source_id)
            .map((item) => String(item.source_id)),
          items: homeworkSummary?.items ?? []
        }
      : null
  };
}

export async function listTeacherAssignableTests(
  actor: ScheduleActor,
  studentId: string,
  options?: { includeAllLevels?: boolean }
): Promise<TeacherAssignableTestOptionDto[]> {
  assertScheduleWriteAccess(actor);
  assertTeacherWorkspaceWriteAccess(actor);
  if (isTeacherScopedActor(actor)) {
    assertTeacherScope(actor, { studentId });
  }

  const repository = createTeacherLessonFollowupRepository();
  const studentResponse = await repository.loadStudentLevel(studentId);
  if (studentResponse.error) {
    throw new ScheduleHttpError(500, "TEACHER_ASSIGNABLE_TESTS_FAILED", "Failed to load student level", studentResponse.error.message);
  }

  const studentLevel = studentResponse.data?.english_level ?? null;
  const response = await repository.listPublishedAssignableTests();
  if (response.error) {
    throw new ScheduleHttpError(500, "TEACHER_ASSIGNABLE_TESTS_FAILED", "Failed to load assignable tests", response.error.message);
  }

  return ((response.data ?? []) as TeacherAssignableTestRow[])
    .filter((row) => {
      if (row.assessment_kind === "placement") return true;
      if (options?.includeAllLevels) return true;
      if (!studentLevel) return true;
      return row.cefr_level === studentLevel;
    })
    .map((row) => ({
      id: String(row.id ?? ""),
      title: String(row.title ?? "Активность"),
      activityType: row.activity_type === "trainer" ? "trainer" : "test",
      assessmentKind: row.assessment_kind === "placement" ? "placement" : "regular",
      cefrLevel: row.cefr_level == null ? null : String(row.cefr_level),
      drillTopicKey: row.drill_topic_key == null ? null : String(row.drill_topic_key),
      drillKind: row.drill_kind === "grammar" || row.drill_kind === "vocabulary" || row.drill_kind === "mixed" ? row.drill_kind : null,
      lessonReinforcement: Boolean(row.lesson_reinforcement)
    }));
}

export async function upsertTeacherLessonFollowup(actor: ScheduleActor, lessonId: string, payload: TeacherLessonFollowupPayload) {
  assertScheduleWriteAccess(actor);
  assertTeacherWorkspaceWriteAccess(actor);
  const repository = createTeacherLessonFollowupRepository();
  const lesson = await getLessonById(lessonId, repository);
  assertLessonScope(actor, lesson);

  if (payload.attendanceStatus === "completed" && !hasLessonEnded(lesson.ends_at)) {
    throw new ScheduleHttpError(
      409,
      "LESSON_NOT_FINISHED",
      "Урок можно отметить проведённым только после его окончания. Измените время урока, если он прошёл раньше."
    );
  }

  const teacherId = isTeacherScopedActor(actor) ? actor.teacherId : lesson.teacher_id;

  const attendancePayload = {
    schedule_lesson_id: lessonId,
    student_id: lesson.student_id,
    teacher_id: teacherId,
    status: payload.attendanceStatus,
    marked_by_profile_id: actor.userId,
    marked_at: new Date().toISOString()
  };

  const outcomePayload = {
    schedule_lesson_id: lessonId,
    student_id: lesson.student_id,
    teacher_id: teacherId,
    summary: payload.summary,
    covered_topics: payload.coveredTopics ?? null,
    mistakes_summary: payload.mistakesSummary ?? null,
    next_steps: payload.nextSteps ?? null,
    visible_to_student: payload.visibleToStudent ?? true,
    created_by_profile_id: actor.userId,
    updated_by_profile_id: actor.userId
  };

  const [attendanceResponse, outcomeResponse] = await Promise.all([
    repository.upsertLessonAttendance(attendancePayload),
    repository.upsertLessonOutcome(outcomePayload)
  ]);

  if (attendanceResponse.error) {
    throw new ScheduleHttpError(500, "LESSON_ATTENDANCE_SAVE_FAILED", "Failed to save lesson attendance", attendanceResponse.error.message);
  }
  if (outcomeResponse.error) {
    throw new ScheduleHttpError(500, "LESSON_OUTCOME_SAVE_FAILED", "Failed to save lesson outcome", outcomeResponse.error.message);
  }

  const normalizedHomeworkTestIds = Array.from(new Set((payload.homeworkTestIds ?? []).filter(Boolean)));
  const shouldCreateHomework = Boolean(payload.homeworkTitle?.trim() || normalizedHomeworkTestIds.length > 0);
  if (shouldCreateHomework) {
    await upsertLessonLinkedHomeworkAssignment(
      {
        studentId: lesson.student_id,
        assignedByProfileId: actor.userId,
        scheduleLessonId: lessonId,
        title: payload.homeworkTitle?.trim() || `Homework after ${lesson.title}`,
        description: payload.homeworkDescription?.trim() || null,
        dueAt: payload.homeworkDueAt || null,
        activityIds: normalizedHomeworkTestIds
      },
      repository.client
    );
  }

  if (payload.attendanceStatus === "completed" || payload.attendanceStatus === "missed_by_student" || payload.attendanceStatus === "missed_by_teacher" || payload.attendanceStatus === "canceled") {
    await repository.updateLessonStatus(lessonId, {
      status: payload.attendanceStatus === "canceled" ? "canceled" : "completed",
      updated_by_profile_id: actor.userId
    });
  }

  if (payload.attendanceStatus === "completed") {
    await applyCompletedLessonCharge(lessonId, actor.userId, repository.client);
  }

  return getTeacherLessonFollowup(actor, lessonId);
}
