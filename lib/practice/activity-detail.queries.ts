import { defineDataLoadingDescriptor } from "@/lib/data-loading/contracts";
import { extractAssignedTestIdsFromHomeworkRows } from "@/lib/homework/assignments.mappers";
import { createHomeworkAssignmentsRepository, type HomeworkAssignmentsRepositoryClient } from "@/lib/homework/assignments.repository";
import {
  createPracticeActivityDetailRepository,
  type PracticeActivityDetailCourseModuleRow,
  type PracticeActivityDetailRepositoryClient,
  type PracticeTestActivityDetailRow,
  type PracticeTestQuestionOptionRow,
  type PracticeTestQuestionRow
} from "@/lib/practice/activity-detail.repository";
import { DEFAULT_PLACEMENT_SCORING_PROFILE, parsePlacementScoringProfile, type PlacementBandKey, type PlacementScoringProfile } from "@/lib/practice/placement";
import { getCurrentStudentProfile } from "@/lib/students/current-student";
import { createClient } from "@/lib/supabase/server";

export type PracticeQuestionOption = {
  id: string;
  optionText: string;
  sortOrder: number;
  isCorrect?: boolean;
};

export type PracticeQuestion = {
  id: string;
  prompt: string;
  explanation: string | null;
  questionType: string;
  sortOrder: number;
  placementBand: PlacementBandKey | null;
  options: PracticeQuestionOption[];
};

export type PracticeLessonActivityDetail = {
  id: string;
  sourceType: "lesson";
  activityType: "trainer";
  title: string;
  description: string | null;
  cefrLevel: null;
  drillTopicKey: null;
  drillKind: null;
  lessonReinforcement: false;
  assigned: false;
  meta: string;
  content: unknown;
};

export type PracticeTestActivityDetail = {
  id: string;
  sourceType: "test";
  activityType: "trainer" | "test";
  assessmentKind: "regular" | "placement";
  title: string;
  description: string | null;
  cefrLevel: string | null;
  drillTopicKey: string | null;
  drillKind: "grammar" | "vocabulary" | "mixed" | null;
  lessonReinforcement: boolean;
  assigned: boolean;
  meta: string;
  passingScore: number;
  timeLimitMinutes: number | null;
  scoringProfile: PlacementScoringProfile | null;
  isSupported: boolean;
  unsupportedQuestionTypes: string[];
  sectionHref: string | null;
  sectionTitle: string | null;
  content: PracticeQuestion[];
};

export type PracticeActivityDetail = PracticeLessonActivityDetail | PracticeTestActivityDetail;

export const PRACTICE_ACTIVITY_DETAIL_DATA_LOADING = defineDataLoadingDescriptor({
  id: "practice-activity-detail",
  owner: "@/lib/practice/queries#getPracticeActivityDetail",
  accessMode: "user_scoped",
  loadLevel: "section",
  shape: "detail",
  issues: [],
  notes: ["Activity detail should stay separate from overview and recommendation feeds."]
});

function readRelationRecord<T extends Record<string, unknown>>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

async function getPracticeStudentProfile() {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) {
    return null;
  }

  return profile;
}

function normalizePracticeActivityType(value: string | null | undefined): "trainer" | "test" {
  return value === "trainer" ? "trainer" : "test";
}

function normalizeAssessmentKind(value: string | null | undefined): "regular" | "placement" {
  return value === "placement" ? "placement" : "regular";
}

async function loadAssignedTestIds(studentId: string, client: PracticeActivityDetailRepositoryClient) {
  const repository = createHomeworkAssignmentsRepository(client as HomeworkAssignmentsRepositoryClient);
  const response = await repository.listActiveAssignedTestItems(studentId);

  if (response.error) return new Set<string>();

  return extractAssignedTestIdsFromHomeworkRows(response.data ?? []);
}

function toPracticeQuestionOption(option: PracticeTestQuestionOptionRow, index: number, exposeCorrectness: boolean): PracticeQuestionOption {
  const result: PracticeQuestionOption = {
    id: String(option.id),
    optionText: option.option_text ?? "",
    sortOrder: Number(option.sort_order ?? index)
  };

  if (exposeCorrectness) {
    result.isCorrect = Boolean(option.is_correct);
  }

  return result;
}

function toPracticeQuestion(question: PracticeTestQuestionRow, exposeCorrectness: boolean): PracticeQuestion {
  const options = (question.test_question_options ?? [])
    .map((option, index) => toPracticeQuestionOption(option, index, exposeCorrectness))
    .sort((left, right) => left.sortOrder - right.sortOrder);

  return {
    id: String(question.id),
    prompt: question.prompt ?? "",
    explanation: question.explanation ?? null,
    questionType: question.question_type ?? "unknown",
    sortOrder: Number(question.sort_order ?? 0),
    placementBand:
      question.placement_band === "beginner" ||
      question.placement_band === "elementary" ||
      question.placement_band === "pre_intermediate" ||
      question.placement_band === "intermediate" ||
      question.placement_band === "upper_intermediate" ||
      question.placement_band === "advanced"
        ? question.placement_band
        : null,
    options
  };
}

function formatActivityTimeLabel(timeLimitMinutes: number | null | undefined) {
  return `${Math.max(Number(timeLimitMinutes ?? 0), 5)} минут`;
}

function resolveDrillKind(value: string | null | undefined) {
  return value === "grammar" || value === "vocabulary" || value === "mixed" ? value : null;
}

export async function getPracticeActivityDetail(activityId: string): Promise<PracticeActivityDetail | null> {
  const [sourceType, rawId] = activityId.split("_");
  if (!rawId || (sourceType !== "lesson" && sourceType !== "test")) return null;

  const profile = await getPracticeStudentProfile();
  if (!profile?.studentId) return null;

  const supabase = await createClient();
  const repository = createPracticeActivityDetailRepository(supabase);

  if (sourceType === "lesson") {
    const { data, error } = await repository.loadLessonDetail(rawId);
    if (error || !data) return null;

    return {
      id: activityId,
      sourceType: "lesson" as const,
      activityType: "trainer" as const,
      title: String(data.title),
      description: data.description ?? null,
      cefrLevel: null,
      drillTopicKey: null,
      drillKind: null,
      lessonReinforcement: false,
      assigned: false,
      meta: `${Math.max(Number(data.duration_minutes ?? 0), 5)} минут`,
      content: data.content
    };
  }

  const { data, error } = await repository.loadTestDetail(rawId);
  if (error || !data) return null;

  const test = data as PracticeTestActivityDetailRow;
  const assignedTestIds = await loadAssignedTestIds(profile.studentId, supabase);
  const assessmentKind = normalizeAssessmentKind(test.assessment_kind ?? null);
  const allowedByLevel = !profile.englishLevel || test.cefr_level === profile.englishLevel;
  const allowedByAssignment = assignedTestIds.has(rawId);
  const isAllowed = assessmentKind === "placement" ? allowedByAssignment : allowedByLevel || allowedByAssignment;
  if (!isAllowed) {
    return null;
  }

  const activityType = normalizePracticeActivityType(test.activity_type ?? null);
  const scoringProfile = assessmentKind === "placement" ? parsePlacementScoringProfile(test.scoring_profile) ?? DEFAULT_PLACEMENT_SCORING_PROFILE : null;
  const courseModule = readRelationRecord(test.course_modules as PracticeActivityDetailCourseModuleRow | PracticeActivityDetailCourseModuleRow[] | null | undefined);
  const parentCourse = readRelationRecord(courseModule?.courses ?? null);
  const sectionHref =
    assessmentKind === "regular" && test.module_id && typeof parentCourse?.slug === "string" && parentCourse.slug.length > 0
      ? `/practice/topics/${parentCourse.slug}/${test.module_id}`
      : null;
  const exposeCorrectness = assessmentKind === "regular";
  const questions = (test.test_questions ?? [])
    .map((question) => toPracticeQuestion(question, exposeCorrectness))
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const unsupportedQuestionTypes = Array.from(
    new Set(
      questions
        .map((question) => question.questionType)
        .filter((questionType) => questionType !== "single_choice")
    )
  );

  return {
    id: activityId,
    sourceType: "test" as const,
    activityType,
    assessmentKind,
    title: String(test.title),
    description: test.description ?? null,
    cefrLevel: test.cefr_level ?? null,
    drillTopicKey: test.drill_topic_key ?? null,
    drillKind: resolveDrillKind(test.drill_kind),
    lessonReinforcement: Boolean(test.lesson_reinforcement),
    assigned: allowedByAssignment,
    passingScore: Number(test.passing_score ?? 70),
    timeLimitMinutes: test.time_limit_minutes == null ? null : Number(test.time_limit_minutes),
    scoringProfile,
    isSupported: unsupportedQuestionTypes.length === 0,
    unsupportedQuestionTypes,
    sectionHref,
    sectionTitle: assessmentKind === "regular" && typeof courseModule?.title === "string" ? courseModule.title : null,
    meta:
      assessmentKind === "placement"
        ? `Placement test · ${formatActivityTimeLabel(test.time_limit_minutes)}`
        : `Проходной балл ${Number(test.passing_score ?? 70)}%, ${formatActivityTimeLabel(test.time_limit_minutes)}`,
    content: questions
  };
}
