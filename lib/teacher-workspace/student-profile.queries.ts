import type { HomeworkAssignmentRow, HomeworkAttemptSummaryRow, HomeworkProgressRow } from "@/lib/homework/assignments.mappers";
import { defineDataLoadingDescriptor } from "@/lib/data-loading/contracts";
import { mapStaffScheduleLessons } from "@/lib/schedule/queries";
import {
  assertStaffAdminCapability,
  assertTeacherCapability,
  assertTeacherScope,
  isTeacherScheduleActor,
  type ScheduleActor
} from "@/lib/schedule/server";
import type { ScheduleLessonRow } from "@/lib/schedule/queries";
import { ScheduleHttpError } from "@/lib/schedule/http";
import { measureServerTiming } from "@/lib/server/timing";
import type { AccessMode } from "@/lib/supabase/access";
import { composeTeacherStudentProfileData } from "@/lib/teacher-workspace/sections";
import {
  buildDisplayName,
  buildEmptyPlacementSummary,
  buildPlacementSummaryFromHomework,
  buildTeacherHomeworkAssignmentDtos,
  isActiveHomeworkStatus,
  isStandaloneHomeworkAssignment,
  mapTeacherStudentMistakes,
  mapTeacherStudentNotes,
  type TeacherHomeworkTestMetadata,
  type TeacherStudentMistakeRow,
  type TeacherStudentNoteRow,
  type TeacherStudentProfileRow
} from "@/lib/teacher-workspace/student-profile.mappers";
import { createTeacherStudentProfileRepository } from "@/lib/teacher-workspace/student-profile.repository";
import type {
  TeacherStudentHomeworkDto,
  TeacherStudentMistakeDto,
  TeacherStudentNoteDto,
  TeacherStudentPlacementSummaryDto,
  TeacherStudentProfileData,
  TeacherStudentProfileHeaderSummary,
  TeacherStudentStandaloneHomeworkSummaryDto
} from "@/lib/teacher-workspace/types";

const TEACHER_STUDENT_PROFILE_ACCESS_MODE: AccessMode = "privileged";

export const TEACHER_STUDENT_PROFILE_DATA_LOADING = defineDataLoadingDescriptor({
  id: "teacher-student-profile",
  owner: "@/lib/teacher-workspace/queries#getTeacherStudentProfileData",
  accessMode: TEACHER_STUDENT_PROFILE_ACCESS_MODE,
  loadLevel: "page",
  shape: "aggregate",
  issues: ["mixed_responsibilities", "overfetch"],
  transitional: true,
  notes: [
    "Profile header, notes, homework, mistakes and lessons should become section loaders later.",
    "Do not add more profile concerns here; future sections are header, notes, homework, mistakes and lesson history."
  ]
});

export const TEACHER_STUDENT_HEADER_DATA_LOADING = defineDataLoadingDescriptor({
  id: "teacher-student-profile-header",
  owner: "@/lib/teacher-workspace/queries#getTeacherStudentHeaderSummary",
  accessMode: TEACHER_STUDENT_PROFILE_ACCESS_MODE,
  loadLevel: "section",
  shape: "summary",
  issues: [],
  notes: ["Teacher student profile critical header summary."]
});

export const TEACHER_STUDENT_NOTES_DATA_LOADING = defineDataLoadingDescriptor({
  id: "teacher-student-profile-notes",
  owner: "@/lib/teacher-workspace/queries#getTeacherStudentNotesFeed",
  accessMode: TEACHER_STUDENT_PROFILE_ACCESS_MODE,
  loadLevel: "section",
  shape: "list",
  issues: [],
  notes: ["Teacher-scoped notes feed section."]
});

export const TEACHER_STUDENT_LESSONS_DATA_LOADING = defineDataLoadingDescriptor({
  id: "teacher-student-profile-lessons",
  owner: "@/lib/teacher-workspace/queries#getTeacherStudentLessonHistory",
  accessMode: TEACHER_STUDENT_PROFILE_ACCESS_MODE,
  loadLevel: "section",
  shape: "list",
  issues: [],
  notes: ["Teacher student profile upcoming/recent lesson history section."]
});

export const TEACHER_STUDENT_HOMEWORK_MISTAKES_DATA_LOADING = defineDataLoadingDescriptor({
  id: "teacher-student-profile-homework-mistakes",
  owner: "@/lib/teacher-workspace/queries#getTeacherStudentHomeworkAndMistakesSnapshot",
  accessMode: TEACHER_STUDENT_PROFILE_ACCESS_MODE,
  loadLevel: "section",
  shape: "list",
  issues: [],
  notes: ["Teacher student profile homework and mistakes snapshot section."]
});

export const TEACHER_STUDENT_BILLING_SNAPSHOT_DATA_LOADING = defineDataLoadingDescriptor({
  id: "teacher-student-profile-billing-snapshot",
  owner: "@/lib/teacher-workspace/queries#getTeacherStudentBillingSnapshot",
  accessMode: TEACHER_STUDENT_PROFILE_ACCESS_MODE,
  loadLevel: "section",
  shape: "detail",
  issues: [],
  notes: ["Staff-only companion billing snapshot for teacher student profile."]
});

type TeacherStudentCoreRow = {
  id: string;
  profile_id: string;
  primary_teacher_id: string | null;
  english_level: string | null;
  target_level: string | null;
  learning_goal: string | null;
};

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

async function loadProfilesMap(profileIds: string[], repository = createTeacherStudentProfileRepository()) {
  const response = await repository.loadProfiles(profileIds);
  if (response.error) {
    throw new ScheduleHttpError(500, "PROFILE_FETCH_FAILED", "Failed to load profiles", response.error.message);
  }

  return new Map<string, TeacherStudentProfileRow>(((response.data ?? []) as TeacherStudentProfileRow[]).map((profile) => [profile.id, profile]));
}

export async function loadTeacherStudentCore(actor: ScheduleActor, studentId: string) {
  assertTeacherActor(actor);
  if (isTeacherScopedActor(actor)) {
    assertTeacherScope(actor, { studentId });
  }

  const repository = createTeacherStudentProfileRepository();
  const studentResponse = await repository.loadStudentCore(studentId);

  if (studentResponse.error) {
    throw new ScheduleHttpError(500, "TEACHER_STUDENT_FAILED", "Failed to load student profile", studentResponse.error.message);
  }
  if (!studentResponse.data) {
    throw new ScheduleHttpError(404, "STUDENT_NOT_FOUND", "Student not found");
  }

  const student = studentResponse.data as TeacherStudentCoreRow;
  const profilesMap = await loadProfilesMap([student.profile_id], repository);

  return {
    student,
    studentName: buildDisplayName(profilesMap.get(student.profile_id), "Ученик")
  };
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

export async function getTeacherStudentHeaderSummary(actor: ScheduleActor, studentId: string): Promise<TeacherStudentProfileHeaderSummary> {
  return measureServerTiming("teacher-student-profile-header", async () => {
    const { student, studentName } = await loadTeacherStudentCore(actor, studentId);

    return {
      studentId: student.id,
      studentName,
      englishLevel: student.english_level,
      targetLevel: student.target_level,
      learningGoal: student.learning_goal
    };
  });
}

export async function getTeacherStudentNotesFeed(actor: ScheduleActor, studentId: string, options: { limit?: number } = {}): Promise<TeacherStudentNoteDto[]> {
  return measureServerTiming("teacher-student-profile-notes", async () => {
    await loadTeacherStudentCore(actor, studentId);
    const repository = createTeacherStudentProfileRepository();
    const response = await repository.loadNotesFeed(studentId, options.limit ?? 10);

    if (response.error) {
      throw new ScheduleHttpError(500, "TEACHER_STUDENT_FAILED", "Failed to load student notes", response.error.message);
    }

    const rows = (response.data ?? []) as TeacherStudentNoteRow[];
    const authorIds = Array.from(new Set(rows.map((item) => item.created_by_profile_id).filter((id): id is string => Boolean(id))));
    const authorsMap = await loadProfilesMap(authorIds, repository);

    return mapTeacherStudentNotes(rows, authorsMap);
  });
}

export async function getTeacherStudentLessonHistory(actor: ScheduleActor, studentId: string, options: { upcomingLimit?: number; recentLimit?: number } = {}) {
  return measureServerTiming("teacher-student-profile-lessons", async () => {
    await loadTeacherStudentCore(actor, studentId);
    const repository = createTeacherStudentProfileRepository();
    const nowIso = new Date().toISOString();
    const [upcomingLessonsResponse, recentLessonsResponse] = await Promise.all([
      repository.loadUpcomingLessons(studentId, nowIso, options.upcomingLimit ?? 5),
      repository.loadRecentLessons(studentId, nowIso, options.recentLimit ?? 5)
    ]);

    if (upcomingLessonsResponse.error || recentLessonsResponse.error) {
      throw new ScheduleHttpError(500, "TEACHER_STUDENT_FAILED", "Failed to load student lesson history");
    }

    const upcomingLessonRows = (upcomingLessonsResponse.data ?? []) as ScheduleLessonRow[];
    const recentLessonRows = (recentLessonsResponse.data ?? []) as ScheduleLessonRow[];
    const mappedLessons = await mapStaffScheduleLessons([...upcomingLessonRows, ...recentLessonRows]);
    const upcomingLessonIds = new Set(upcomingLessonRows.map((row) => row.id));

    return {
      upcomingLessons: mappedLessons.filter((lesson) => upcomingLessonIds.has(lesson.id)),
      recentLessons: mappedLessons.filter((lesson) => !upcomingLessonIds.has(lesson.id))
    };
  });
}

export async function getTeacherStudentHomeworkSnapshot(actor: ScheduleActor, studentId: string, options: { limit?: number } = {}): Promise<TeacherStudentHomeworkDto[]> {
  return measureServerTiming("teacher-student-profile-homework", async () => {
    await loadTeacherStudentCore(actor, studentId);
    const repository = createTeacherStudentProfileRepository();
    const response = await repository.listHomeworkSnapshot(studentId, options.limit ?? 10);

    if (response.error) {
      throw new ScheduleHttpError(500, "TEACHER_STUDENT_FAILED", "Failed to load student homework", response.error.message);
    }

    return enrichTeacherHomeworkAssignments(studentId, (response.data ?? []) as HomeworkAssignmentRow[], repository);
  });
}

export async function listTeacherStudentStandaloneHomework(
  actor: ScheduleActor,
  studentId: string,
  options: { sourceLimit?: number; outputLimit?: number } = {}
): Promise<TeacherStudentStandaloneHomeworkSummaryDto> {
  return measureServerTiming("teacher-student-profile-standalone-homework", async () => {
    const assignments = await getTeacherStudentHomeworkSnapshot(actor, studentId, { limit: options.sourceLimit });
    const standaloneAssignments = assignments.filter(isStandaloneHomeworkAssignment);
    const activeAssignments = standaloneAssignments.filter((assignment) => isActiveHomeworkStatus(assignment.status));
    const recentAssignments = standaloneAssignments.filter((assignment) => !isActiveHomeworkStatus(assignment.status)).slice(0, 2);

    const result = [...activeAssignments, ...recentAssignments];
    return {
      assignments: options.outputLimit == null ? result : result.slice(0, options.outputLimit)
    };
  });
}

export async function getTeacherStudentPlacementSummary(
  actor: ScheduleActor,
  studentId: string
): Promise<TeacherStudentPlacementSummaryDto | null> {
  return measureServerTiming("teacher-student-profile-placement", async () => {
    await loadTeacherStudentCore(actor, studentId);
    const repository = createTeacherStudentProfileRepository();
    const canonicalPlacement = await resolveCanonicalPlacementTest(repository);
    if (!canonicalPlacement) {
      return buildEmptyPlacementSummary(null);
    }

    const response = await repository.listPlacementAssignments(studentId, canonicalPlacement.id);

    if (response.error) {
      throw new ScheduleHttpError(500, "TEACHER_STUDENT_FAILED", "Failed to load placement assignment", response.error.message);
    }

    const assignments = ((response.data ?? []) as HomeworkAssignmentRow[]).slice(0, 1);
    if (assignments.length === 0) {
      return buildEmptyPlacementSummary(canonicalPlacement);
    }

    const [enriched] = await enrichTeacherHomeworkAssignments(studentId, [assignments[0]], repository);
    const summary = buildPlacementSummaryFromHomework(enriched ?? null);
    return summary?.testId ? summary : buildEmptyPlacementSummary(canonicalPlacement);
  });
}

export async function getTeacherStudentMistakesSnapshot(actor: ScheduleActor, studentId: string, options: { limit?: number } = {}): Promise<TeacherStudentMistakeDto[]> {
  return measureServerTiming("teacher-student-profile-mistakes", async () => {
    await loadTeacherStudentCore(actor, studentId);
    const repository = createTeacherStudentProfileRepository();
    const response = await repository.loadMistakes(studentId, options.limit ?? 10);

    if (response.error) {
      throw new ScheduleHttpError(500, "TEACHER_STUDENT_FAILED", "Failed to load student mistakes", response.error.message);
    }

    return mapTeacherStudentMistakes((response.data ?? []) as TeacherStudentMistakeRow[]);
  });
}

export async function getTeacherStudentHomeworkAndMistakesSnapshot(actor: ScheduleActor, studentId: string) {
  const [recentHomework, recentMistakes] = await Promise.all([
    getTeacherStudentHomeworkSnapshot(actor, studentId),
    getTeacherStudentMistakesSnapshot(actor, studentId)
  ]);

  return {
    recentHomework,
    recentMistakes
  };
}

export async function getTeacherStudentBillingSnapshot(actor: ScheduleActor, _studentId: string) {
  assertTeacherActor(actor);
  void _studentId;
  return null;
}

export async function getTeacherStudentProfileData(actor: ScheduleActor, studentId: string): Promise<TeacherStudentProfileData> {
  const [header, notes, lessonHistory, homeworkSnapshot, standaloneHomework, placementSummary, mistakesSnapshot, billingSnapshot] = await Promise.all([
    getTeacherStudentHeaderSummary(actor, studentId),
    getTeacherStudentNotesFeed(actor, studentId),
    getTeacherStudentLessonHistory(actor, studentId),
    getTeacherStudentHomeworkSnapshot(actor, studentId),
    listTeacherStudentStandaloneHomework(actor, studentId),
    getTeacherStudentPlacementSummary(actor, studentId),
    getTeacherStudentMistakesSnapshot(actor, studentId),
    getTeacherStudentBillingSnapshot(actor, studentId)
  ]);

  return composeTeacherStudentProfileData({
    header,
    notes,
    upcomingLessons: lessonHistory.upcomingLessons,
    recentLessons: lessonHistory.recentLessons,
    recentHomework: homeworkSnapshot,
    standaloneHomework: standaloneHomework.assignments,
    placementSummary,
    recentMistakes: mistakesSnapshot,
    billingSnapshot,
    billingSummaryDeferred: !isTeacherScopedActor(actor)
  });
}
