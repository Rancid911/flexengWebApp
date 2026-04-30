import type { UserRole } from "@/lib/auth/get-user-role";
import type { HomeworkAssignmentRow, HomeworkAttemptSummaryRow, HomeworkProgressRow } from "@/lib/homework/assignments.mappers";
import type {
  TeacherStudentHomeworkDto,
  TeacherStudentHomeworkItemDto,
  TeacherStudentMistakeDto,
  TeacherStudentNoteDto,
  TeacherStudentPlacementSummaryDto
} from "@/lib/teacher-workspace/types";

export type TeacherStudentProfileRow = {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole | null;
};

export type TeacherStudentNoteRow = {
  id: string;
  student_id: string;
  teacher_id: string;
  body: string;
  visibility: "private" | "manager_visible";
  created_by_profile_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type TeacherStudentMistakeRow = {
  id: string;
  mistake_count: number;
  last_mistake_at: string | null;
  tests: { title: string | null } | { title: string | null }[] | null;
  course_modules: { title: string | null } | { title: string | null }[] | null;
};

export type TeacherHomeworkTestMetadata = {
  id: string;
  title: string | null;
  activity_type: string | null;
  assessment_kind: string | null;
};

export function buildDisplayName(profile: Pick<TeacherStudentProfileRow, "display_name" | "first_name" | "last_name" | "email"> | undefined, fallback: string) {
  if (!profile) return fallback;
  return profile.display_name || [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email || fallback;
}

export function mapTeacherStudentNotes(rows: TeacherStudentNoteRow[], authorsMap: Map<string, TeacherStudentProfileRow>) {
  return rows.map(
    (item): TeacherStudentNoteDto => {
      const author = item.created_by_profile_id ? authorsMap.get(item.created_by_profile_id) : null;
      return {
        id: item.id,
        studentId: item.student_id,
        teacherId: item.teacher_id,
        body: item.body,
        visibility: item.visibility,
        createdByProfileId: item.created_by_profile_id,
        createdByName: author ? buildDisplayName(author, "Пользователь") : null,
        createdByRole: author?.role ?? null,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      };
    }
  );
}

export function buildTeacherHomeworkAssignmentDtos(params: {
  assignments: HomeworkAssignmentRow[];
  tests: TeacherHomeworkTestMetadata[];
  progressRows: HomeworkProgressRow[];
  attemptRows: HomeworkAttemptSummaryRow[];
}) {
  const testsById = new Map<string, { title: string; activityType: "trainer" | "test"; assessmentKind: "regular" | "placement" }>();
  for (const row of params.tests) {
    testsById.set(String(row.id), {
      title: row.title ?? "Активность",
      activityType: row.activity_type === "trainer" ? "trainer" : "test",
      assessmentKind: row.assessment_kind === "placement" ? "placement" : "regular"
    });
  }

  const progressByItemId = new Map<string, string>();
  for (const row of params.progressRows) {
    progressByItemId.set(String(row.homework_item_id), row.status ?? "not_started");
  }

  const latestAttemptByTestId = new Map<
    string,
    {
      score: number | null;
      submittedAt: string | null;
      recommendedLevel: string | null;
      recommendedBandLabel: string | null;
      placementSummary: TeacherStudentHomeworkItemDto["placementSummary"];
    }
  >();
  for (const row of params.attemptRows) {
    const testId = String(row.test_id);
    if (!latestAttemptByTestId.has(testId)) {
      latestAttemptByTestId.set(testId, {
        score: row.score == null ? null : Number(row.score),
        submittedAt: row.submitted_at ?? null,
        recommendedLevel: row.recommended_level ?? null,
        recommendedBandLabel: row.recommended_band_label ?? null,
        placementSummary:
          row.placement_summary && typeof row.placement_summary === "object"
            ? {
                recommendedLevel:
                  typeof row.placement_summary.recommendedLevel === "string" ? row.placement_summary.recommendedLevel : row.recommended_level ?? null,
                recommendedBandLabel:
                  typeof row.placement_summary.recommendedBandLabel === "string"
                    ? row.placement_summary.recommendedBandLabel
                    : row.recommended_band_label ?? null,
                sectionScores: Array.isArray(row.placement_summary.sectionScores)
                  ? row.placement_summary.sectionScores.flatMap((item) =>
                      item &&
                      typeof item === "object" &&
                      typeof item.key === "string" &&
                      typeof item.label === "string"
                        ? [
                            {
                              key: item.key,
                              label: item.label,
                              correctAnswers: Number(item.correctAnswers ?? 0),
                              totalQuestions: Number(item.totalQuestions ?? 0)
                            }
                          ]
                        : []
                    )
                  : []
              }
            : null
      });
    }
  }

  return params.assignments.map((assignment) => {
    const items = (assignment.homework_items ?? [])
      .slice()
      .sort((left, right) => Number(left.sort_order ?? 0) - Number(right.sort_order ?? 0))
      .map((item) => {
        const sourceId = item.source_id ? String(item.source_id) : "";
        const linkedTest = item.source_type === "test" ? testsById.get(sourceId) : null;
        const latestAttempt = item.source_type === "test" ? latestAttemptByTestId.get(sourceId) : null;

        return {
          id: String(item.id),
          sourceType: item.source_type ?? "unknown",
          sourceId,
          title: linkedTest?.title ?? sourceId,
          activityType: linkedTest?.activityType ?? null,
          assessmentKind: linkedTest?.assessmentKind ?? "regular",
          status: progressByItemId.get(String(item.id)) ?? "not_started",
          required: Boolean(item.required),
          lastScore: latestAttempt?.score ?? null,
          lastSubmittedAt: latestAttempt?.submittedAt ?? null,
          recommendedLevel: latestAttempt?.recommendedLevel ?? null,
          recommendedBandLabel: latestAttempt?.recommendedBandLabel ?? null,
          placementSummary: latestAttempt?.placementSummary ?? null
        };
      });

    const requiredItems = items.filter((item) => item.required);
    const completedRequiredCount = requiredItems.filter((item) => item.status === "completed").length;

    return {
      id: assignment.id,
      title: assignment.title ?? "Домашнее задание",
      description: assignment.description ?? null,
      status: assignment.status ?? "not_started",
      dueAt: assignment.due_at ?? null,
      completedAt: assignment.completed_at ?? null,
      createdAt: assignment.created_at ?? null,
      linkedLessonId: assignment.schedule_lesson_id ?? null,
      requiredCount: requiredItems.length,
      completedRequiredCount,
      items
    } satisfies TeacherStudentHomeworkDto;
  });
}

export function mapPlacementStatus(status: string | null | undefined): TeacherStudentPlacementSummaryDto["status"] {
  if (status === "completed") return "completed";
  if (status === "in_progress") return "in_progress";
  if (status === "overdue") return "overdue";
  if (status === "not_started") return "not_started";
  return "not_assigned";
}

export function buildEmptyPlacementSummary(test: { id: string | null; title: string | null } | null): TeacherStudentPlacementSummaryDto {
  return {
    assignmentId: null,
    status: "not_assigned",
    testId: test?.id ?? null,
    title: test?.title ?? null,
    attemptId: null,
    score: null,
    recommendedLevel: null,
    recommendedBandLabel: null,
    submittedAt: null
  };
}

export function buildPlacementSummaryFromHomework(homework: TeacherStudentHomeworkDto | null): TeacherStudentPlacementSummaryDto | null {
  if (!homework) {
    return buildEmptyPlacementSummary(null);
  }

  const placementItem = homework.items.find((item) => item.assessmentKind === "placement") ?? null;
  if (!placementItem) {
    return buildEmptyPlacementSummary(null);
  }

  return {
    assignmentId: homework.id,
    status: mapPlacementStatus(homework.status),
    testId: placementItem.sourceId ?? null,
    title: placementItem.title ?? homework.title,
    attemptId: null,
    score: placementItem.lastScore ?? null,
    recommendedLevel: placementItem.recommendedLevel ?? null,
    recommendedBandLabel: placementItem.recommendedBandLabel ?? null,
    submittedAt: placementItem.lastSubmittedAt ?? null
  };
}

export function isStandaloneHomeworkAssignment(homework: TeacherStudentHomeworkDto) {
  return homework.linkedLessonId == null && !homework.items.some((item) => item.assessmentKind === "placement");
}

export function isActiveHomeworkStatus(status: string) {
  return status === "not_started" || status === "in_progress" || status === "overdue";
}

export function mapTeacherStudentMistakes(rows: TeacherStudentMistakeRow[]) {
  return rows.map(
    (item): TeacherStudentMistakeDto => ({
      id: item.id,
      count: item.mistake_count,
      lastMistakeAt: item.last_mistake_at,
      testTitle: Array.isArray(item.tests) ? item.tests[0]?.title ?? null : item.tests?.title ?? null,
      moduleTitle: Array.isArray(item.course_modules) ? item.course_modules[0]?.title ?? null : item.course_modules?.title ?? null
    })
  );
}
