export type HomeworkAssignmentRow = {
  id: string;
  student_id?: string | null;
  title: string | null;
  description: string | null;
  due_at: string | null;
  status?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
  schedule_lesson_id?: string | null;
  homework_items?: HomeworkItemRow[] | null;
};

export type HomeworkItemRow = {
  id: string;
  assignment_id?: string | null;
  source_type: string | null;
  source_id: string | null;
  sort_order?: number | null;
  required: boolean | null;
};

export type HomeworkProgressRow = {
  homework_item_id: string;
  assignment_id?: string | null;
  status: string | null;
};

export type HomeworkTestMetadataRow = {
  id: string;
  title?: string | null;
  activity_type?: string | null;
  assessment_kind?: string | null;
  cefr_level?: string | null;
  drill_topic_key?: string | null;
};

export type HomeworkAttemptSummaryRow = {
  test_id: string;
  score: number | null;
  submitted_at: string | null;
  recommended_level?: string | null;
  recommended_band_label?: string | null;
  placement_summary?: {
    recommendedLevel?: string | null;
    recommendedBandLabel?: string | null;
    sectionScores?: Array<{
      key?: string;
      label?: string;
      correctAnswers?: number;
      totalQuestions?: number;
    }>;
  } | null;
};

export type HomeworkItemProgressCounts = {
  itemCount: number;
  requiredCount: number;
  completedRequiredCount: number;
};

type HomeworkAssignedTestRow = {
  homework_items?: Array<Pick<HomeworkItemRow, "source_type" | "source_id">> | null;
};

export function isSchemaMissing(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("does not exist") || normalized.includes("could not find") || normalized.includes("schema cache");
}

export function getHomeworkTestIds(assignments: HomeworkAssignedTestRow[]) {
  return Array.from(
    new Set(
      assignments.flatMap((assignment) =>
        (assignment.homework_items ?? [])
          .filter((item) => item.source_type === "test" && item.source_id)
          .map((item) => String(item.source_id))
      )
    )
  );
}

export function extractAssignedTestIdsFromHomeworkRows(assignments: HomeworkAssignedTestRow[]) {
  return new Set(getHomeworkTestIds(assignments));
}

export function getHomeworkItemIds(assignments: Array<Pick<HomeworkAssignmentRow, "homework_items">>) {
  return assignments.flatMap((assignment) => (assignment.homework_items ?? []).map((item) => String(item.id)));
}

export function hasPlacementAssessment(
  assignment: Pick<HomeworkAssignmentRow, "homework_items">,
  testsById: Map<string, { assessment_kind?: string | null; assessmentKind?: string | null }>
) {
  return (assignment.homework_items ?? []).some((item) => {
    const test = testsById.get(String(item.source_id));
    return item.source_type === "test" && (test?.assessment_kind === "placement" || test?.assessmentKind === "placement");
  });
}

export function buildProgressByItemId(rows: HomeworkProgressRow[]) {
  const progressByItemId = new Map<string, string>();
  for (const row of rows) {
    progressByItemId.set(String(row.homework_item_id), row.status ?? "not_started");
  }
  return progressByItemId;
}

export function countHomeworkProgress(items: HomeworkItemRow[], progressByItemId: Map<string, string>): HomeworkItemProgressCounts {
  const requiredItems = items.filter((item) => Boolean(item.required));
  return {
    itemCount: items.length,
    requiredCount: requiredItems.length,
    completedRequiredCount: requiredItems.filter((item) => progressByItemId.get(String(item.id)) === "completed").length
  };
}

export function buildLatestAttemptByTestId<TPlacementSummary>(
  rows: HomeworkAttemptSummaryRow[],
  mapPlacementSummary: (row: HomeworkAttemptSummaryRow) => TPlacementSummary
) {
  const latestAttemptByTestId = new Map<
    string,
    {
      score: number | null;
      submittedAt: string | null;
      recommendedLevel: string | null;
      recommendedBandLabel: string | null;
      placementSummary: TPlacementSummary;
    }
  >();

  for (const row of rows) {
    const testId = String(row.test_id);
    if (!latestAttemptByTestId.has(testId)) {
      latestAttemptByTestId.set(testId, {
        score: row.score == null ? null : Number(row.score),
        submittedAt: row.submitted_at ?? null,
        recommendedLevel: row.recommended_level ?? null,
        recommendedBandLabel: row.recommended_band_label ?? null,
        placementSummary: mapPlacementSummary(row)
      });
    }
  }

  return latestAttemptByTestId;
}
