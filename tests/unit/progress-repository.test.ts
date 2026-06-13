import { describe, expect, it, vi } from "vitest";

import { createProgressRepository } from "@/lib/progress/progress.repository";

function makeQueryResult(data: unknown = [], count: number | null = null) {
  const result = { data, error: null, count };
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    neq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
    catch: (reject: (reason: unknown) => unknown) => Promise.resolve(result).catch(reject),
    finally: (callback: () => void) => Promise.resolve(result).finally(callback)
  };
  return builder;
}

describe("progress repository", () => {
  it("loads overview sources with the current student filters", async () => {
    const queries = new Map([
      ["student_lesson_progress", makeQueryResult([], 2)],
      ["student_test_attempts", makeQueryResult([])],
      ["student_mistakes", makeQueryResult([], 3)]
    ]);
    const fromMock = vi.fn((table: string) => queries.get(table));
    const repository = createProgressRepository({ from: fromMock } as never);

    await repository.loadCompletedLessonsCount("student-1");
    await repository.loadCompletedAttempts("student-1");
    await repository.loadMistakesCount("student-1");

    const lessonProgress = queries.get("student_lesson_progress")!;
    expect(lessonProgress.select).toHaveBeenCalledWith("id", { count: "exact", head: true });
    expect(lessonProgress.eq).toHaveBeenCalledWith("student_id", "student-1");
    expect(lessonProgress.eq).toHaveBeenCalledWith("status", "completed");

    const attempts = queries.get("student_test_attempts")!;
    expect(attempts.select).toHaveBeenCalledWith("score, status, tests(assessment_kind)");
    expect(attempts.eq).toHaveBeenCalledWith("student_id", "student-1");
    expect(attempts.neq).toHaveBeenCalledWith("status", "in_progress");

    const mistakes = queries.get("student_mistakes")!;
    expect(mistakes.select).toHaveBeenCalledWith("id", { count: "exact", head: true });
    expect(mistakes.eq).toHaveBeenCalledWith("student_id", "student-1");
  });

  it("preserves history and weak-point ordering and limits", async () => {
    const historyQuery = makeQueryResult();
    const weakPointsQuery = makeQueryResult();
    const fromMock = vi.fn((table: string) => (table === "student_test_attempts" ? historyQuery : weakPointsQuery));
    const repository = createProgressRepository({ from: fromMock } as never);

    await repository.loadHistory("student-1");
    await repository.loadWeakPoints("student-1");

    expect(historyQuery.select).toHaveBeenCalledWith("id, score, status, created_at, submitted_at, tests(title, assessment_kind)");
    expect(historyQuery.eq).toHaveBeenCalledWith("student_id", "student-1");
    expect(historyQuery.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(historyQuery.limit).toHaveBeenCalledWith(50);

    expect(weakPointsQuery.select).toHaveBeenCalledWith("id, mistake_count, test_id, tests(title)");
    expect(weakPointsQuery.eq).toHaveBeenCalledWith("student_id", "student-1");
    expect(weakPointsQuery.order).toHaveBeenCalledWith("mistake_count", { ascending: false });
    expect(weakPointsQuery.limit).toHaveBeenCalledWith(20);
  });

  it("loads published topic sources and student lesson progress", async () => {
    const queries = new Map([
      ["courses", makeQueryResult()],
      ["course_modules", makeQueryResult()],
      ["lessons", makeQueryResult()],
      ["tests", makeQueryResult()],
      ["student_lesson_progress", makeQueryResult()]
    ]);
    const fromMock = vi.fn((table: string) => queries.get(table));
    const repository = createProgressRepository({ from: fromMock } as never);

    await repository.loadPublishedCourses();
    await repository.loadPublishedModules();
    await repository.loadPublishedLessons(["module-1"]);
    await repository.loadPublishedTests(["module-1"]);
    await repository.loadLessonProgress("student-1", ["lesson-1"]);

    expect(queries.get("courses")!.select).toHaveBeenCalledWith("id, title");
    expect(queries.get("courses")!.eq).toHaveBeenCalledWith("is_published", true);
    expect(queries.get("course_modules")!.select).toHaveBeenCalledWith("id, course_id");
    expect(queries.get("course_modules")!.eq).toHaveBeenCalledWith("is_published", true);
    expect(queries.get("lessons")!.in).toHaveBeenCalledWith("module_id", ["module-1"]);
    expect(queries.get("lessons")!.eq).toHaveBeenCalledWith("is_published", true);
    expect(queries.get("tests")!.in).toHaveBeenCalledWith("module_id", ["module-1"]);
    expect(queries.get("tests")!.eq).toHaveBeenCalledWith("is_published", true);
    expect(queries.get("student_lesson_progress")!.select).toHaveBeenCalledWith(
      "progress_percent, lessons(module_id, course_modules(course_id))"
    );
    expect(queries.get("student_lesson_progress")!.eq).toHaveBeenCalledWith("student_id", "student-1");
    expect(queries.get("student_lesson_progress")!.in).toHaveBeenCalledWith("lesson_id", ["lesson-1"]);
  });
});
