"use client";

import { useCallback, useState, type FormEvent } from "react";

import {
  createDefaultTestsForm,
  type TestQuestionForm,
  type TestsForm,
  UUID_RE
} from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.constants";
import type { DataDeps, RefreshDeps, TestFormSetter } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console-action-types";
import { ApiRequestError, fetchJson, slugify } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.utils";
import { useAdminActionRunner } from "@/app/(workspace)/(staff-zone)/admin/ui/use-admin-action-runner";
import { useAsyncAction } from "@/hooks/use-async-action";
import type { AdminTestDetailDto, AdminTestDto } from "@/lib/admin/types";
import { DEFAULT_PLACEMENT_SCORING_PROFILE } from "@/lib/practice/placement";

type TestQuestionPayload = {
  id?: string;
  prompt: string;
  explanation: string | null;
  question_type: "single_choice";
  placement_band: string | null;
  sort_order: number;
  options: Array<{
    id?: string;
    option_text: string;
    is_correct: boolean;
    sort_order: number;
  }>;
};

type TestPayload = {
  activity_type: TestsForm["activity_type"];
  assessment_kind: TestsForm["assessment_kind"];
  title: string;
  description: string | null;
  lesson_id: string | null;
  module_id: string | null;
  cefr_level: string | null;
  drill_topic_key: string | null;
  drill_kind: TestsForm["drill_kind"] | null;
  scoring_profile: Record<string, unknown> | null;
  lesson_reinforcement: boolean;
  sort_order?: number;
  passing_score: number;
  time_limit_minutes: number | null;
  is_published: boolean;
  questions: TestQuestionPayload[];
};

type TestPatchPayload = Partial<Omit<TestPayload, "questions">> & {
  questions?: TestQuestionPayload[];
};

function getTestValidationMessage(error: unknown) {
  if (!(error instanceof ApiRequestError) || error.code !== "VALIDATION_ERROR") return null;

  const fieldErrors = error.details?.fieldErrors ?? {};
  if (fieldErrors.module_id?.length) return "Выберите модуль";
  if (fieldErrors.cefr_level?.length) return "Выберите CEFR";
  if (fieldErrors.drill_topic_key?.length) return "Заполните тему";
  if (fieldErrors.assessment_kind?.length) return "Для тренажёра используйте обычный тип проверки";
  if (fieldErrors.scoring_profile?.length) return "Проверьте scoring profile для placement";
  if (fieldErrors.questions?.length) return "Заполните вопрос и все 4 варианта ответа";

  return error.message;
}

function normalizeOptionalString(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function normalizeOptionalUuid(value: string) {
  const trimmed = value.trim();
  return UUID_RE.test(trimmed) ? trimmed : null;
}

function normalizeOptionalNumber(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? null : Number(trimmed);
}

function normalizeTestsFormPayload(testsForm: TestsForm, includeEmptySortOrder: boolean): TestPayload {
  const generatedTopicKey = testsForm.drill_topic_key.trim() || slugify(testsForm.title) || `material-${crypto.randomUUID().slice(0, 8)}`;
  const scoringProfile =
    testsForm.assessment_kind === "placement"
      ? testsForm.scoring_profile.trim()
        ? JSON.parse(testsForm.scoring_profile)
        : DEFAULT_PLACEMENT_SCORING_PROFILE
      : null;
  const sortOrderValue = testsForm.sort_order.trim();
  const payload: TestPayload = {
    activity_type: testsForm.activity_type,
    assessment_kind: testsForm.assessment_kind,
    title: testsForm.title.trim(),
    description: normalizeOptionalString(testsForm.description),
    lesson_id: normalizeOptionalUuid(testsForm.lesson_id),
    module_id: normalizeOptionalUuid(testsForm.module_id),
    cefr_level: normalizeOptionalString(testsForm.cefr_level),
    drill_topic_key: generatedTopicKey || null,
    drill_kind: testsForm.drill_kind || null,
    scoring_profile: scoringProfile,
    lesson_reinforcement: testsForm.lesson_reinforcement,
    passing_score: Number(testsForm.passing_score.trim() || "70"),
    time_limit_minutes: normalizeOptionalNumber(testsForm.time_limit_minutes),
    is_published: testsForm.is_published,
    questions: testsForm.questions.map((question, questionIndex) => ({
      ...(question.id ? { id: question.id } : {}),
      prompt: question.prompt.trim(),
      explanation: normalizeOptionalString(question.explanation),
      question_type: "single_choice",
      placement_band: testsForm.assessment_kind === "placement" ? question.placementBand || null : null,
      sort_order: questionIndex,
      options: question.options.map((option, optionIndex) => ({
        ...(option.id ? { id: option.id } : {}),
        option_text: option.optionText.trim(),
        is_correct: option.isCorrect,
        sort_order: optionIndex
      }))
    }))
  };

  if (includeEmptySortOrder || sortOrderValue) {
    payload.sort_order = Number(sortOrderValue || "0");
  }

  return payload;
}

function arePayloadValuesEqual(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function buildChangedTestPayload(current: TestPayload, baseline: TestPayload): TestPatchPayload {
  const patch: TestPatchPayload = {};
  const scalarKeys = Object.keys(current).filter((key) => key !== "questions") as Array<keyof Omit<TestPayload, "questions">>;

  for (const key of scalarKeys) {
    if (!arePayloadValuesEqual(current[key], baseline[key])) {
      patch[key] = current[key] as never;
    }
  }

  if (!arePayloadValuesEqual(current.questions, baseline.questions)) {
    patch.questions = current.questions;
  }

  return patch;
}

function isEmptyPatch(payload: TestPatchPayload) {
  return Object.keys(payload).length === 0;
}

export function useAdminTestsActions({
  editingTest,
  refresh,
  data,
  setActionError,
  setEditingTest,
  setTestsDrawerOpen,
  setTestsForm
}: {
  editingTest: AdminTestDto | null;
  refresh: Pick<RefreshDeps, "prefetchNeighbors" | "testsPage" | "testsPageCount" | "testsQuery">;
  data: Pick<DataDeps, "invalidateCacheForQuery" | "loadTestsPageData">;
  setActionError: (value: string) => void;
  setEditingTest: (value: AdminTestDto | null) => void;
  setTestsDrawerOpen: (value: boolean) => void;
  setTestsForm: TestFormSetter;
}) {
  const { runWithActionError } = useAdminActionRunner(setActionError);
  const { pending: submittingTest, run: runTestSubmit } = useAsyncAction();
  const [editingTestBaseline, setEditingTestBaseline] = useState<TestPayload | null>(null);

  const buildTestsFormFromDetail = useCallback((item: AdminTestDetailDto): TestsForm => {
    const baseForm = createDefaultTestsForm();
    const questions = item.questions.length > 0
      ? item.questions.map((question) => ({
          clientId: crypto.randomUUID(),
          id: question.id,
          prompt: question.prompt,
          explanation: question.explanation ?? "",
          placementBand: (question.placement_band ?? "") as TestQuestionForm["placementBand"],
          options: Array.from({ length: 4 }, (_, index) => {
            const option = question.options[index];
            return {
              clientId: crypto.randomUUID(),
              id: option?.id,
              optionText: option?.option_text ?? "",
              isCorrect: option?.is_correct ?? index === 0
            };
          }) as TestQuestionForm["options"]
        }))
      : baseForm.questions;

    return {
      ...baseForm,
      activity_type: item.activity_type,
      assessment_kind: item.assessment_kind,
      title: item.title,
      description: item.description ?? "",
      lesson_id: item.lesson_id ?? "",
      module_id: item.module_id ?? "",
      cefr_level: item.cefr_level ?? "",
      drill_topic_key: item.drill_topic_key ?? "",
      drill_kind: item.drill_kind ?? "",
      scoring_profile: item.scoring_profile ? JSON.stringify(item.scoring_profile, null, 2) : "",
      lesson_reinforcement: item.lesson_reinforcement,
      sort_order: String(item.sort_order),
      passing_score: String(item.passing_score),
      time_limit_minutes: item.time_limit_minutes == null ? "" : String(item.time_limit_minutes),
      is_published: item.is_published,
      has_attempts: item.has_attempts,
      questions
    };
  }, []);

  const openCreateTestDrawer = useCallback(() => {
    setEditingTest(null);
    setEditingTestBaseline(null);
    setTestsForm(createDefaultTestsForm());
    setTestsDrawerOpen(true);
  }, [setEditingTest, setTestsDrawerOpen, setTestsForm]);

  const startEditingTest = useCallback(
    async (item: AdminTestDto) => {
      await runWithActionError({
        fallbackMessage: "Не удалось загрузить учебный материал",
        action: async () => {
          const detail = await fetchJson<AdminTestDetailDto>(`/api/admin/tests/${item.id}`);
          const nextForm = buildTestsFormFromDetail(detail);
          setEditingTest(item);
          setEditingTestBaseline(normalizeTestsFormPayload(nextForm, true));
          setTestsForm(nextForm);
          setTestsDrawerOpen(true);
        }
      });
    },
    [buildTestsFormFromDetail, runWithActionError, setEditingTest, setTestsDrawerOpen, setTestsForm]
  );

  const submitTest = useCallback(
    async (event: FormEvent, testsForm: TestsForm) => {
      event.preventDefault();
      if (submittingTest) return;

      await runTestSubmit({
        onStart: () => setActionError(""),
        onError: (requestError) => {
          setActionError(getTestValidationMessage(requestError) ?? (requestError instanceof Error ? requestError.message : "Не удалось сохранить учебный материал"));
        },
        action: async () => {
          const fullPayload = normalizeTestsFormPayload(testsForm, Boolean(editingTest) || testsForm.sort_order.trim() !== "");

          if (editingTest) {
            const payload = editingTestBaseline ? buildChangedTestPayload(fullPayload, editingTestBaseline) : fullPayload;
            if (isEmptyPatch(payload)) {
              setTestsDrawerOpen(false);
              setEditingTest(null);
              setEditingTestBaseline(null);
              setTestsForm(createDefaultTestsForm());
              return;
            }
            await fetchJson(`/api/admin/tests/${editingTest.id}`, { method: "PATCH", body: JSON.stringify(payload) });
          } else {
            await fetchJson("/api/admin/tests", { method: "POST", body: JSON.stringify(fullPayload) });
          }

          setTestsDrawerOpen(false);
          setEditingTest(null);
          setEditingTestBaseline(null);
          setTestsForm(createDefaultTestsForm());
          data.invalidateCacheForQuery("tests", refresh.testsQuery);
          void data.loadTestsPageData(refresh.testsPage, refresh.testsQuery, { revalidate: true }).catch((requestError) => {
            console.error("ADMIN_TESTS_REFRESH_AFTER_SAVE_FAILED", requestError);
          });
          refresh.prefetchNeighbors("tests", refresh.testsPage, refresh.testsPageCount, refresh.testsQuery);
        }
      });
    },
    [data, editingTest, editingTestBaseline, refresh, runTestSubmit, setActionError, setEditingTest, setTestsDrawerOpen, setTestsForm, submittingTest]
  );

  const deleteTest = useCallback(
    async (id: string) => {
      if (!window.confirm("Удалить учебный материал?")) return;
      await runWithActionError({
        fallbackMessage: "Не удалось удалить учебный материал",
        action: async () => {
          await fetchJson(`/api/admin/tests/${id}`, { method: "DELETE" });
          data.invalidateCacheForQuery("tests", refresh.testsQuery);
          await data.loadTestsPageData(refresh.testsPage, refresh.testsQuery, { revalidate: true });
          refresh.prefetchNeighbors("tests", refresh.testsPage, refresh.testsPageCount, refresh.testsQuery);
        }
      });
    },
    [data, refresh, runWithActionError]
  );

  return { deleteTest, openCreateTestDrawer, startEditingTest, submitTest, submittingTest };
}
