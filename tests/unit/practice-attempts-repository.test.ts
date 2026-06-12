import { describe, expect, it, vi } from "vitest";

import { createPracticeAttemptsRepository } from "@/lib/practice/practice-attempts.repository";

function makeQueryResult(data: unknown = null, error: unknown = null) {
  const result = { data, error };
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => result),
    single: vi.fn(async () => result),
    then: (resolve: (value: typeof result) => unknown) =>
      Promise.resolve(result).then(resolve),
    catch: (reject: (reason: unknown) => unknown) =>
      Promise.resolve(result).catch(reject),
    finally: (callback: () => void) =>
      Promise.resolve(result).finally(callback)
  };
  return builder;
}

describe("practice attempts repository", () => {
  it("loads authoritative grading data and module course context", async () => {
    const testQuery = makeQueryResult({});
    const moduleQuery = makeQueryResult({ course_id: "course-1" });
    const fromMock = vi
      .fn()
      .mockReturnValueOnce(testQuery)
      .mockReturnValueOnce(moduleQuery);
    const repository = createPracticeAttemptsRepository({
      from: fromMock
    } as never);

    await repository.loadTestForGrading("test-1");
    await repository.loadCourseIdForModule("module-1");

    expect(fromMock).toHaveBeenNthCalledWith(1, "tests");
    expect(testQuery.select).toHaveBeenCalledWith(
      "module_id, assessment_kind, scoring_profile, test_questions(id, prompt, explanation, question_type, placement_band, sort_order, test_question_options(id, option_text, is_correct, sort_order))"
    );
    expect(testQuery.eq).toHaveBeenCalledWith("id", "test-1");
    expect(testQuery.maybeSingle).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenNthCalledWith(2, "course_modules");
    expect(moduleQuery.select).toHaveBeenCalledWith("course_id");
    expect(moduleQuery.eq).toHaveBeenCalledWith("id", "module-1");
  });

  it("creates attempt and answer rows with the existing payload boundaries", async () => {
    const attemptQuery = makeQueryResult({ id: "attempt-1" });
    const answersQuery = makeQueryResult();
    const fromMock = vi
      .fn()
      .mockReturnValueOnce(attemptQuery)
      .mockReturnValueOnce(answersQuery);
    const repository = createPracticeAttemptsRepository({
      from: fromMock
    } as never);
    const attemptPayload = {
      student_id: "student-1",
      test_id: "test-1",
      score: 100,
      correct_answers: 1,
      total_questions: 1,
      status: "passed" as const,
      recommended_level: null,
      recommended_band_label: null,
      placement_summary: null,
      started_at: "2026-06-12T09:59:00.000Z",
      submitted_at: "2026-06-12T10:00:00.000Z",
      time_spent_seconds: 60
    };
    const answersPayload = [
      {
        attempt_id: "attempt-1",
        question_id: "question-1",
        selected_option_id: "option-1",
        answer_text: null,
        is_correct: true
      }
    ];

    await repository.createAttempt(attemptPayload);
    await repository.createAnswers(answersPayload);

    expect(fromMock).toHaveBeenNthCalledWith(1, "student_test_attempts");
    expect(attemptQuery.insert).toHaveBeenCalledWith(attemptPayload);
    expect(attemptQuery.select).toHaveBeenCalledWith("id");
    expect(attemptQuery.single).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenNthCalledWith(2, "student_test_answers");
    expect(answersQuery.insert).toHaveBeenCalledWith(answersPayload);
  });

  it("loads, updates, creates, and resolves student mistakes with current filters", async () => {
    const loadQuery = makeQueryResult([]);
    const updateQuery = makeQueryResult();
    const insertQuery = makeQueryResult();
    const resolveQuery = makeQueryResult();
    const fromMock = vi
      .fn()
      .mockReturnValueOnce(loadQuery)
      .mockReturnValueOnce(updateQuery)
      .mockReturnValueOnce(insertQuery)
      .mockReturnValueOnce(resolveQuery);
    const repository = createPracticeAttemptsRepository({
      from: fromMock
    } as never);
    const updatePayload = {
      attempt_id: "attempt-1",
      test_id: "test-1",
      module_id: "module-1",
      course_id: "course-1",
      mistake_count: 2,
      last_mistake_at: "2026-06-12T10:00:00.000Z",
      resolved_at: null
    };

    await repository.loadExistingMistakes("student-1", ["question-1"]);
    await repository.updateMistake("mistake-1", updatePayload);
    await repository.createMistake({
      student_id: "student-1",
      question_id: "question-2",
      ...updatePayload
    });
    await repository.resolveMistakes(
      "student-1",
      ["question-3"],
      {
        resolved_at: "2026-06-12T10:00:00.000Z",
        attempt_id: "attempt-1",
        test_id: "test-1"
      }
    );

    expect(loadQuery.select).toHaveBeenCalledWith(
      "id, question_id, mistake_count"
    );
    expect(loadQuery.eq).toHaveBeenCalledWith("student_id", "student-1");
    expect(loadQuery.in).toHaveBeenCalledWith("question_id", ["question-1"]);
    expect(updateQuery.update).toHaveBeenCalledWith(updatePayload);
    expect(updateQuery.eq).toHaveBeenCalledWith("id", "mistake-1");
    expect(insertQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        student_id: "student-1",
        question_id: "question-2"
      })
    );
    expect(resolveQuery.eq).toHaveBeenCalledWith("student_id", "student-1");
    expect(resolveQuery.in).toHaveBeenCalledWith("question_id", [
      "question-3"
    ]);
  });
});

