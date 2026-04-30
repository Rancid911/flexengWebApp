import type { z } from "zod";

import { writeAudit } from "@/lib/admin/audit";
import { AdminHttpError, paginated } from "@/lib/admin/http";
import { toTestDetailDto, toTestDto } from "@/lib/admin/tests";
import type { AdminTestDetailDto, AdminTestDto, PaginatedResponse } from "@/lib/admin/types";
import { adminTestCreateSchema, adminTestUpdateSchema } from "@/lib/admin/validation";
import { toWordCardsListMaterialDto } from "@/lib/admin/word-card-sets";
import { createAdminWordCardSetRepository } from "@/lib/admin/word-card-sets.repository";
import { createAdminTestRepository } from "@/lib/admin/tests.repository";

type AdminActor = { userId: string };
type AdminTestCreateInput = z.infer<typeof adminTestCreateSchema>;
type AdminTestUpdateInput = z.infer<typeof adminTestUpdateSchema>;
type AdminTestQuestionInput = NonNullable<AdminTestUpdateInput["questions"]>[number] | AdminTestCreateInput["questions"][number];

type ListInput = {
  page: number;
  pageSize: number;
  q?: string;
};

function isSchemaMissing(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("does not exist") || normalized.includes("could not find") || normalized.includes("schema cache");
}

async function loadHasAttempts(repository: ReturnType<typeof createAdminTestRepository>, testId: string) {
  const { count, error } = await repository.hasAttempts(testId);
  if (error) {
    throw new AdminHttpError(500, "TEST_ATTEMPTS_FETCH_FAILED", "Failed to check test attempts", error.message);
  }
  return (count ?? 0) > 0;
}

async function loadNextSortOrder(repository: ReturnType<typeof createAdminTestRepository>) {
  const { data, error } = await repository.loadNextSortOrder();
  if (error) {
    throw new AdminHttpError(500, "TEST_SORT_ORDER_FETCH_FAILED", "Failed to calculate test sort order", error.message);
  }
  const currentMax = Number(data?.[0]?.sort_order ?? -1);
  return Number.isFinite(currentMax) ? currentMax + 1 : 0;
}

async function createQuestionsAndOptions(repository: ReturnType<typeof createAdminTestRepository>, testId: string, questions: AdminTestCreateInput["questions"]) {
  for (const [questionIndex, question] of questions.entries()) {
    const { data: createdQuestion, error: questionError } = await repository.createQuestion({
      test_id: testId,
      prompt: question.prompt,
      explanation: question.explanation ?? null,
      question_type: "single_choice",
      placement_band: question.placement_band ?? null,
      sort_order: question.sort_order ?? questionIndex
    });
    if (questionError) {
      throw new AdminHttpError(500, "TEST_QUESTION_CREATE_FAILED", "Failed to create test question", questionError.message);
    }

    const optionsPayload = question.options.map((option, optionIndex) => ({
      question_id: String(createdQuestion.id),
      option_text: option.option_text,
      is_correct: option.is_correct,
      sort_order: option.sort_order ?? optionIndex
    }));
    const { error: optionsError } = await repository.insertOptions(optionsPayload);
    if (optionsError) {
      throw new AdminHttpError(500, "TEST_OPTION_CREATE_FAILED", "Failed to create test options", optionsError.message);
    }
  }
}

async function syncQuestionsAndOptions(
  repository: ReturnType<typeof createAdminTestRepository>,
  testId: string,
  existingDetail: Record<string, unknown>,
  nextQuestions: AdminTestQuestionInput[],
  hasAttempts: boolean
) {
  const existingQuestions = (Array.isArray(existingDetail.test_questions) ? existingDetail.test_questions : []) as Array<Record<string, unknown>>;
  const existingQuestionIds = new Set(existingQuestions.map((question) => String(question.id)));
  const existingOptionIds = new Set(
    existingQuestions.flatMap((question) =>
      Array.isArray(question.test_question_options) ? question.test_question_options.map((option) => String((option as Record<string, unknown>).id)) : []
    )
  );

  const nextQuestionIds = new Set(nextQuestions.flatMap((question) => (question.id ? [question.id] : [])));
  const nextOptionIds = new Set(nextQuestions.flatMap((question) => question.options.flatMap((option) => (option.id ? [option.id] : []))));

  const removedQuestionIds = Array.from(existingQuestionIds).filter((id) => !nextQuestionIds.has(id));
  const removedOptionIds = Array.from(existingOptionIds).filter((id) => !nextOptionIds.has(id));

  if (hasAttempts && (removedQuestionIds.length > 0 || removedOptionIds.length > 0)) {
    throw new AdminHttpError(
      409,
      "TEST_STRUCTURE_LOCKED",
      "Нельзя удалять существующие вопросы или варианты у теста, который уже проходили ученики."
    );
  }

  for (const [questionIndex, question] of nextQuestions.entries()) {
    const questionPayload = {
      test_id: testId,
      prompt: question.prompt,
      explanation: question.explanation ?? null,
      question_type: "single_choice",
      placement_band: question.placement_band ?? null,
      sort_order: question.sort_order ?? questionIndex
    };

    let questionId = question.id ?? "";
    if (question.id && existingQuestionIds.has(question.id)) {
      const { error: updateQuestionError } = await repository.updateQuestion(question.id, questionPayload);
      if (updateQuestionError) {
        throw new AdminHttpError(500, "TEST_QUESTION_UPDATE_FAILED", "Failed to update test question", updateQuestionError.message);
      }
    } else {
      const { data: createdQuestion, error: createQuestionError } = await repository.createQuestion(questionPayload);
      if (createQuestionError) {
        throw new AdminHttpError(500, "TEST_QUESTION_CREATE_FAILED", "Failed to create test question", createQuestionError.message);
      }
      questionId = String(createdQuestion.id);
    }

    const existingQuestion = existingQuestions.find((item) => String(item.id) === questionId);
    const existingQuestionOptionIds = new Set(
      Array.isArray(existingQuestion?.test_question_options)
        ? existingQuestion.test_question_options.map((option) => String((option as Record<string, unknown>).id))
        : []
    );

    for (const [optionIndex, option] of question.options.entries()) {
      const optionPayload = {
        question_id: questionId,
        option_text: option.option_text,
        is_correct: option.is_correct,
        sort_order: option.sort_order ?? optionIndex
      };

      if (option.id && existingQuestionOptionIds.has(option.id)) {
        const { error: updateOptionError } = await repository.updateOption(option.id, optionPayload);
        if (updateOptionError) {
          throw new AdminHttpError(500, "TEST_OPTION_UPDATE_FAILED", "Failed to update test option", updateOptionError.message);
        }
      } else {
        const { error: createOptionError } = await repository.createOption(optionPayload);
        if (createOptionError) {
          throw new AdminHttpError(500, "TEST_OPTION_CREATE_FAILED", "Failed to create test option", createOptionError.message);
        }
      }
    }
  }

  if (removedOptionIds.length > 0) {
    const { error: deleteOptionsError } = await repository.deleteOptions(removedOptionIds);
    if (deleteOptionsError) {
      throw new AdminHttpError(500, "TEST_OPTION_DELETE_FAILED", "Failed to delete removed test options", deleteOptionsError.message);
    }
  }

  if (removedQuestionIds.length > 0) {
    const { error: deleteQuestionsError } = await repository.deleteQuestions(removedQuestionIds);
    if (deleteQuestionsError) {
      throw new AdminHttpError(500, "TEST_QUESTION_DELETE_FAILED", "Failed to delete removed test questions", deleteQuestionsError.message);
    }
  }
}

export async function listAdminTestMaterials({ page, pageSize, q }: ListInput): Promise<PaginatedResponse<AdminTestDto>> {
  const testRepository = createAdminTestRepository();
  const wordCardRepository = createAdminWordCardSetRepository();
  const from = (page - 1) * pageSize;
  const to = from + pageSize;

  const [testsResult, cardSetsResult] = await Promise.all([testRepository.list(q), wordCardRepository.listMaterials(q)]);
  if (testsResult.error) throw new AdminHttpError(500, "TESTS_FETCH_FAILED", "Failed to fetch tests", testsResult.error.message);

  if (cardSetsResult.error && !isSchemaMissing(cardSetsResult.error.message)) {
    throw new AdminHttpError(500, "WORD_CARD_SETS_FETCH_FAILED", "Failed to fetch word card sets", cardSetsResult.error.message);
  }

  const materials = [
    ...(testsResult.data ?? []).map((item) => toTestDto(item as Record<string, unknown>)),
    ...(!cardSetsResult.error ? (cardSetsResult.data ?? []).map((item) => toWordCardsListMaterialDto(item as Record<string, unknown>)) : [])
  ].sort((left, right) => {
    if (left.sort_order !== right.sort_order) return left.sort_order - right.sort_order;
    return new Date(right.created_at ?? 0).getTime() - new Date(left.created_at ?? 0).getTime();
  });

  return paginated(materials.slice(from, to), materials.length, page, pageSize);
}

export async function getAdminTest(id: string): Promise<AdminTestDetailDto> {
  const repository = createAdminTestRepository();
  const [{ data, error }, hasAttempts] = await Promise.all([repository.loadDetail(id), loadHasAttempts(repository, id)]);
  if (error) throw new AdminHttpError(404, "TEST_NOT_FOUND", "Test not found");
  return toTestDetailDto(data as Record<string, unknown>, hasAttempts);
}

export async function createAdminTest(actor: AdminActor, input: AdminTestCreateInput): Promise<AdminTestDetailDto> {
  const repository = createAdminTestRepository();
  const { questions, ...testPayload } = input;

  if (testPayload.sort_order == null) {
    testPayload.sort_order = await loadNextSortOrder(repository);
  }

  const { data, error } = await repository.createTest(testPayload);
  if (error) throw new AdminHttpError(500, "TEST_CREATE_FAILED", "Failed to create test", error.message);

  const testId = String(data.id);
  try {
    await createQuestionsAndOptions(repository, testId, questions);
  } catch (requestError) {
    await repository.deleteTest(testId);
    throw requestError;
  }

  const { data: detail, error: detailError } = await repository.loadDetail(testId);
  if (detailError) throw new AdminHttpError(500, "TEST_FETCH_FAILED", "Failed to load created test", detailError.message);

  await writeAudit({
    actorUserId: actor.userId,
    entity: "tests",
    entityId: testId,
    action: "create",
    after: detail
  });

  return toTestDetailDto(detail as Record<string, unknown>, false);
}

export async function updateAdminTest(actor: AdminActor, id: string, input: AdminTestUpdateInput): Promise<AdminTestDetailDto> {
  const repository = createAdminTestRepository();
  const { data: before, error: beforeError } = await repository.loadDetail(id);
  if (beforeError) throw new AdminHttpError(404, "TEST_NOT_FOUND", "Test not found");

  const hasAttempts = await loadHasAttempts(repository, id);
  const { questions, ...patch } = input;
  const existingQuestions = Array.isArray((before as Record<string, unknown>).test_questions)
    ? ((before as Record<string, unknown>).test_questions as unknown[])
    : [];

  if (patch.is_published === true && questions === undefined && existingQuestions.length === 0) {
    throw new AdminHttpError(400, "VALIDATION_ERROR", "Нельзя опубликовать тест без вопросов", {
      fieldErrors: {
        questions: ["Добавьте хотя бы один вопрос перед публикацией."]
      }
    });
  }

  if (questions !== undefined) {
    await syncQuestionsAndOptions(repository, id, before as Record<string, unknown>, questions, hasAttempts);
  }

  if (Object.keys(patch).length > 0) {
    const { error } = await repository.updateTest(id, patch);
    if (error) throw new AdminHttpError(500, "TEST_UPDATE_FAILED", "Failed to update test", error.message);
  }

  const { data: afterDetail, error: afterDetailError } = await repository.loadDetail(id);
  if (afterDetailError) throw new AdminHttpError(500, "TEST_FETCH_FAILED", "Failed to load updated test", afterDetailError.message);

  await writeAudit({
    actorUserId: actor.userId,
    entity: "tests",
    entityId: id,
    action: "update",
    before,
    after: afterDetail
  });

  return toTestDetailDto(afterDetail as Record<string, unknown>, hasAttempts);
}

export async function deleteAdminTest(actor: AdminActor, id: string): Promise<{ ok: true }> {
  const repository = createAdminTestRepository();
  const { data: before, error: beforeError } = await repository.loadRaw(id);
  if (beforeError) throw new AdminHttpError(404, "TEST_NOT_FOUND", "Test not found");

  const { error } = await repository.deleteTest(id);
  if (error) throw new AdminHttpError(500, "TEST_DELETE_FAILED", "Failed to delete test", error.message);

  await writeAudit({
    actorUserId: actor.userId,
    entity: "tests",
    entityId: id,
    action: "delete",
    before
  });

  return { ok: true };
}
