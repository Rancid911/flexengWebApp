import { cache } from "react";

import { createHomeworkAssignmentsRepository } from "@/lib/homework/assignments.repository";
import {
  buildLatestAttemptByTestId,
  buildProgressByItemId,
  countHomeworkProgress,
  getHomeworkItemIds,
  getHomeworkTestIds,
  hasPlacementAssessment,
  isSchemaMissing,
  type HomeworkAssignmentRow,
  type HomeworkAttemptSummaryRow,
  type HomeworkProgressRow,
  type HomeworkTestMetadataRow
} from "@/lib/homework/assignments.mappers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStudentProfile } from "@/lib/students/current-student";
import { defineDataLoadingDescriptor } from "@/lib/data-loading/contracts";
import type { HomeworkAssignmentsRepositoryClient } from "@/lib/homework/assignments.repository";

export type HomeworkListItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueAt: string | null;
  itemCount: number;
  requiredCount: number;
  completedRequiredCount: number;
};

export type HomeworkItemDetail = {
  id: string;
  source_type: string;
  source_id: string;
  sort_order: number;
  required: boolean;
  title: string;
  href: string | null;
  activityType: "trainer" | "test" | null;
  cefrLevel: string | null;
  drillTopicKey: string | null;
  status: string;
  lastScore: number | null;
  lastSubmittedAt: string | null;
  assessmentKind: "regular" | "placement";
  recommendedLevel: string | null;
  recommendedBandLabel: string | null;
  placementSummary: {
    recommendedLevel: string | null;
    recommendedBandLabel: string | null;
    sectionScores: Array<{
      key: string;
      label: string;
      correctAnswers: number;
      totalQuestions: number;
    }>;
  } | null;
};

export type HomeworkOverviewSummary = {
  activeCount: number;
  overdueCount: number;
  nearestDueAt: string | null;
  nearestDueTitle: string | null;
};

export const HOMEWORK_OVERVIEW_SUMMARY_DATA_LOADING = defineDataLoadingDescriptor({
  id: "homework-overview-summary",
  owner: "@/lib/homework/queries#getHomeworkOverviewSummary",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "summary",
  issues: [],
  notes: ["Page-critical counters and nearest deadline summary for the student homework overview."]
});

export const HOMEWORK_LIST_DATA_LOADING = defineDataLoadingDescriptor({
  id: "homework-list",
  owner: "@/lib/homework/queries#getHomeworkAssignments",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "list",
  issues: []
});

export const HOMEWORK_DETAIL_DATA_LOADING = defineDataLoadingDescriptor({
  id: "homework-detail",
  owner: "@/lib/homework/queries#getHomeworkAssignmentDetail",
  accessMode: "user_scoped",
  loadLevel: "section",
  shape: "detail",
  issues: []
});

async function createStudentHomeworkRepository() {
  return createHomeworkAssignmentsRepository((await createClient()) as HomeworkAssignmentsRepositoryClient);
}

function mapPlacementSummary(row: HomeworkAttemptSummaryRow): HomeworkItemDetail["placementSummary"] {
  return row.placement_summary && typeof row.placement_summary === "object"
    ? {
        recommendedLevel: typeof row.placement_summary.recommendedLevel === "string" ? row.placement_summary.recommendedLevel : row.recommended_level ?? null,
        recommendedBandLabel:
          typeof row.placement_summary.recommendedBandLabel === "string" ? row.placement_summary.recommendedBandLabel : row.recommended_band_label ?? null,
        sectionScores: Array.isArray(row.placement_summary.sectionScores)
          ? row.placement_summary.sectionScores.flatMap((item) =>
              item && typeof item === "object" && typeof item.key === "string" && typeof item.label === "string"
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
    : null;
}

const loadHomeworkAssignmentsByStudent = cache(async (studentId: string, status?: "active" | "completed" | "overdue") => {
  const repository = await createStudentHomeworkRepository();
  const response = await repository.listAssignmentsByStudent(studentId, status);
  if (response.error) {
    if (isSchemaMissing(response.error.message)) return [];
    return [];
  }

  const items = (response.data ?? []) as HomeworkAssignmentRow[];
  const testIds = getHomeworkTestIds(items);
  const testsById = new Map<string, { assessment_kind: string | null }>();
  if (testIds.length > 0) {
    const testsResponse = await repository.loadTestsAssessment(testIds);
    if (!testsResponse.error) {
      for (const row of (testsResponse.data ?? []) as Array<{ id: string; assessment_kind: string | null }>) {
        testsById.set(String(row.id), { assessment_kind: row.assessment_kind ?? null });
      }
    }
  }

  const visibleItems = items.filter((item) => !hasPlacementAssessment(item, testsById));
  const homeworkItemIds = getHomeworkItemIds(visibleItems);
  let progressByItemId = new Map<string, string>();
  if (homeworkItemIds.length > 0) {
    const progressResponse = await repository.loadProgressByItemIds(studentId, homeworkItemIds);
    if (!progressResponse.error) {
      progressByItemId = buildProgressByItemId((progressResponse.data ?? []) as HomeworkProgressRow[]);
    }
  }

  return visibleItems.map((item): HomeworkListItem => {
    const homeworkItems = item.homework_items ?? [];
    const counts = countHomeworkProgress(homeworkItems, progressByItemId);
    return {
      id: String(item.id),
      title: item.title ?? "Домашнее задание",
      description: item.description ?? null,
      status: String(item.status ?? "not_started"),
      dueAt: item.due_at ?? null,
      ...counts
    };
  });
});

export function buildHomeworkOverviewSummary(items: HomeworkListItem[]): HomeworkOverviewSummary {
  const activeCount = items.filter((item) => item.status === "not_started" || item.status === "in_progress").length;
  const overdueCount = items.filter((item) => item.status === "overdue").length;
  const nearestDueItem =
    items
      .filter((item) => item.status !== "completed" && item.dueAt)
      .sort((left, right) => new Date(left.dueAt ?? 0).getTime() - new Date(right.dueAt ?? 0).getTime())[0] ?? null;

  return {
    activeCount,
    overdueCount,
    nearestDueAt: nearestDueItem?.dueAt ?? null,
    nearestDueTitle: nearestDueItem?.title ?? null
  };
}

export async function getHomeworkOverviewSummary(): Promise<HomeworkOverviewSummary> {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) {
    return {
      activeCount: 0,
      overdueCount: 0,
      nearestDueAt: null,
      nearestDueTitle: null
    };
  }

  const items = await loadHomeworkAssignmentsByStudent(profile.studentId);
  return buildHomeworkOverviewSummary(items);
}

export async function getHomeworkAssignments(status?: "active" | "completed" | "overdue") {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) return [];
  return loadHomeworkAssignmentsByStudent(profile.studentId, status);
}

export async function getHomeworkAssignmentDetail(id: string) {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) return null;

  const repository = await createStudentHomeworkRepository();
  const response = await repository.loadAssignmentDetail(profile.studentId, id);
  if (response.error) {
    if (isSchemaMissing(response.error.message)) return null;
    return null;
  }

  const assignment = response.data as HomeworkAssignmentRow;
  const testIds = getHomeworkTestIds([assignment]);
  const testsById = new Map<
    string,
    {
      title: string;
      activity_type: string | null;
      assessment_kind: string | null;
      cefr_level: string | null;
      drill_topic_key: string | null;
    }
  >();
  if (testIds.length > 0) {
    const testsResponse = await repository.loadTestsDetail(testIds);
    if (!testsResponse.error) {
      for (const row of (testsResponse.data ?? []) as HomeworkTestMetadataRow[]) {
        testsById.set(String(row.id), {
          title: row.title ?? "Активность",
          activity_type: row.activity_type ?? null,
          assessment_kind: row.assessment_kind ?? null,
          cefr_level: row.cefr_level ?? null,
          drill_topic_key: row.drill_topic_key ?? null
        });
      }
    }
  }

  if (hasPlacementAssessment(assignment, testsById)) {
    return null;
  }

  const homeworkItemIds = getHomeworkItemIds([assignment]);
  let progressByItemId = new Map<string, string>();
  if (homeworkItemIds.length > 0) {
    const progressResponse = await repository.loadProgressByItemIds(profile.studentId, homeworkItemIds);
    if (!progressResponse.error) {
      progressByItemId = buildProgressByItemId((progressResponse.data ?? []) as HomeworkProgressRow[]);
    }
  }

  const latestAttemptByTestId = new Map<
    string,
    {
      score: number | null;
      submittedAt: string | null;
      recommendedLevel: string | null;
      recommendedBandLabel: string | null;
      placementSummary: HomeworkItemDetail["placementSummary"];
    }
  >();
  if (testIds.length > 0) {
    const attemptsResponse = await repository.loadLatestAttemptsByTestIds(profile.studentId, testIds);
    if (!attemptsResponse.error) {
      for (const [testId, attempt] of buildLatestAttemptByTestId((attemptsResponse.data ?? []) as HomeworkAttemptSummaryRow[], mapPlacementSummary)) {
        latestAttemptByTestId.set(testId, attempt);
      }
    }
  }

  const homeworkItems: HomeworkItemDetail[] = (assignment.homework_items ?? []).map((item) => {
    const sourceId = item.source_id ? String(item.source_id) : "";
    const linkedTest = item.source_type === "test" ? testsById.get(sourceId) : null;
    const latestAttempt = item.source_type === "test" ? latestAttemptByTestId.get(sourceId) : null;

    return {
      id: String(item.id),
      source_type: item.source_type ?? "unknown",
      source_id: sourceId,
      sort_order: Number(item.sort_order ?? 0),
      required: Boolean(item.required),
      title: linkedTest?.title ?? sourceId,
      href: item.source_type === "test" ? `/practice/activity/test_${sourceId}` : null,
      activityType: linkedTest?.activity_type === "trainer" ? "trainer" : linkedTest ? "test" : null,
      cefrLevel: linkedTest?.cefr_level ?? null,
      drillTopicKey: linkedTest?.drill_topic_key ?? null,
      status: progressByItemId.get(String(item.id)) ?? "not_started",
      lastScore: latestAttempt?.score ?? null,
      lastSubmittedAt: latestAttempt?.submittedAt ?? null,
      assessmentKind: linkedTest?.assessment_kind === "placement" ? "placement" : "regular",
      recommendedLevel: latestAttempt?.recommendedLevel ?? null,
      recommendedBandLabel: latestAttempt?.recommendedBandLabel ?? null,
      placementSummary: latestAttempt?.placementSummary ?? null
    };
  });

  const requiredItems = homeworkItems.filter((item) => item.required);
  const completedRequiredCount = requiredItems.filter((item) => item.status === "completed").length;

  return {
    ...assignment,
    requiredCount: requiredItems.length,
    completedRequiredCount,
    homework_items: homeworkItems
  };
}
