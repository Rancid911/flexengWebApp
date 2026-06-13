import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentStudentProfileMock, createRepositoryMock, repository } = vi.hoisted(() => {
  const repository = {
    loadCompletedLessonsCount: vi.fn(),
    loadCompletedAttempts: vi.fn(),
    loadMistakesCount: vi.fn(),
    loadHistory: vi.fn(),
    loadPublishedCourses: vi.fn(),
    loadPublishedModules: vi.fn(),
    loadPublishedLessons: vi.fn(),
    loadPublishedTests: vi.fn(),
    loadLessonProgress: vi.fn(),
    loadWeakPoints: vi.fn()
  };

  return {
    getCurrentStudentProfileMock: vi.fn(),
    createRepositoryMock: vi.fn(async () => repository),
    repository
  };
});

vi.mock("@/lib/students/current-student", () => ({
  getCurrentStudentProfile: () => getCurrentStudentProfileMock()
}));

vi.mock("@/lib/progress/progress.repository", () => ({
  createUserScopedProgressRepository: () => createRepositoryMock()
}));

vi.mock("@/lib/server/timing", () => ({
  measureServerTiming: (_label: string, callback: () => Promise<unknown>) => callback()
}));

import {
  getProgressByTopics,
  getProgressHistory,
  getProgressOverview,
  getWeakPoints
} from "@/lib/progress/progress.service";

function ok(data: unknown, count: number | null = null) {
  return { data, error: null, count };
}

describe("progress service", () => {
  beforeEach(() => {
    getCurrentStudentProfileMock.mockReset();
    createRepositoryMock.mockClear();
    for (const method of Object.values(repository)) {
      method.mockReset();
    }
  });

  it("returns empty read models without creating a repository when no student is linked", async () => {
    getCurrentStudentProfileMock.mockResolvedValue(null);

    await expect(getProgressOverview()).resolves.toEqual({
      completedLessons: 0,
      totalAttempts: 0,
      averageScore: 0,
      weakPoints: 0
    });
    await expect(getProgressHistory()).resolves.toEqual([]);
    await expect(getProgressByTopics()).resolves.toEqual([]);
    await expect(getWeakPoints()).resolves.toEqual([]);
    expect(createRepositoryMock).not.toHaveBeenCalled();
  });

  it("assembles overview and excludes placement attempts from totals", async () => {
    getCurrentStudentProfileMock.mockResolvedValue({ studentId: "student-1", englishLevel: "B1" });
    repository.loadCompletedLessonsCount.mockResolvedValue(ok([], 4));
    repository.loadCompletedAttempts.mockResolvedValue(
      ok([
        { score: 80, tests: { assessment_kind: "regular" } },
        { score: 90, tests: [{ assessment_kind: "regular" }] },
        { score: 100, tests: { assessment_kind: "placement" } }
      ])
    );
    repository.loadMistakesCount.mockResolvedValue(ok([], 2));

    await expect(getProgressOverview()).resolves.toEqual({
      completedLessons: 4,
      totalAttempts: 2,
      averageScore: 85,
      weakPoints: 2
    });
  });

  it("maps history rows and filters placement assessments", async () => {
    getCurrentStudentProfileMock.mockResolvedValue({ studentId: "student-1", englishLevel: "B1" });
    repository.loadHistory.mockResolvedValue(
      ok([
        {
          id: "attempt-1",
          score: 84,
          status: "passed",
          created_at: "2026-04-18T18:30:00.000Z",
          submitted_at: "2026-04-18T18:45:00.000Z",
          tests: { title: "Grammar", assessment_kind: "regular" }
        },
        {
          id: "attempt-2",
          score: 100,
          status: "passed",
          created_at: "2026-04-18T19:00:00.000Z",
          submitted_at: null,
          tests: { title: "Placement", assessment_kind: "placement" }
        }
      ])
    );

    await expect(getProgressHistory()).resolves.toEqual([
      {
        id: "attempt-1",
        score: 84,
        status: "passed",
        created_at: "2026-04-18T18:30:00.000Z",
        submitted_at: "2026-04-18T18:45:00.000Z",
        title: "Grammar"
      }
    ]);
  });

  it("preserves soft fallback results when repository reads fail", async () => {
    getCurrentStudentProfileMock.mockResolvedValue({ studentId: "student-1", englishLevel: "B1" });
    repository.loadCompletedLessonsCount.mockResolvedValue({ data: null, error: { message: "failed" }, count: null });
    repository.loadCompletedAttempts.mockResolvedValue({ data: null, error: { message: "failed" }, count: null });
    repository.loadMistakesCount.mockResolvedValue({ data: null, error: { message: "failed" }, count: null });
    repository.loadHistory.mockResolvedValue({ data: null, error: { message: "failed" }, count: null });
    repository.loadWeakPoints.mockResolvedValue({ data: null, error: { message: "failed" }, count: null });

    await expect(getProgressOverview()).resolves.toEqual({
      completedLessons: 0,
      totalAttempts: 0,
      averageScore: 0,
      weakPoints: 0
    });
    await expect(getProgressHistory()).resolves.toEqual([]);
    await expect(getWeakPoints()).resolves.toEqual([]);
  });

  it("assembles visible topic progress for the current CEFR level", async () => {
    getCurrentStudentProfileMock.mockResolvedValue({ studentId: "student-1", englishLevel: "B1" });
    repository.loadPublishedCourses.mockResolvedValue(
      ok([
        { id: "course-1", title: "Grammar" },
        { id: "course-2", title: "Vocabulary" },
        { id: "course-3", title: "Hidden" }
      ])
    );
    repository.loadPublishedModules.mockResolvedValue(
      ok([
        { id: "module-1", course_id: "course-1" },
        { id: "module-2", course_id: "course-2" },
        { id: "module-3", course_id: "course-3" }
      ])
    );
    repository.loadPublishedLessons.mockResolvedValue(
      ok([
        { id: "lesson-1", module_id: "module-1", lesson_type: "practice" },
        { id: "lesson-2", module_id: "module-1", lesson_type: "quiz" },
        { id: "lesson-3", module_id: "module-3", lesson_type: "video" }
      ])
    );
    repository.loadPublishedTests.mockResolvedValue(
      ok([
        { id: "test-1", module_id: "module-2", cefr_level: "B1", assessment_kind: "regular" },
        { id: "test-2", module_id: "module-3", cefr_level: "B2", assessment_kind: "regular" },
        { id: "test-3", module_id: "module-3", cefr_level: "B1", assessment_kind: "placement" }
      ])
    );
    repository.loadLessonProgress.mockResolvedValue(
      ok([
        { progress_percent: 50, lessons: { course_modules: { course_id: "course-1" } } },
        { progress_percent: 100, lessons: [{ course_modules: [{ course_id: "course-1" }] }] }
      ])
    );

    await expect(getProgressByTopics()).resolves.toEqual([
      { id: "course-1", title: "Grammar", progressPercent: 75 },
      { id: "course-2", title: "Vocabulary", progressPercent: 0 }
    ]);
    expect(repository.loadLessonProgress).toHaveBeenCalledWith("student-1", ["lesson-1", "lesson-2"]);
  });

  it("maps weak points and preserves fallback values", async () => {
    getCurrentStudentProfileMock.mockResolvedValue({ studentId: "student-1", englishLevel: "B1" });
    repository.loadWeakPoints.mockResolvedValue(
      ok([
        { id: "mistake-1", mistake_count: 3, tests: [{ title: "Articles" }] },
        { id: "mistake-2", mistake_count: null, tests: null }
      ])
    );

    await expect(getWeakPoints()).resolves.toEqual([
      { id: "mistake-1", title: "Articles", count: 3 },
      { id: "mistake-2", title: "Слабое место", count: 1 }
    ]);
  });
});
