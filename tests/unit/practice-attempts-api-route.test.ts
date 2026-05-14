import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getAppActorMock = vi.fn();
const submitPracticeTestAttemptMock = vi.fn();

vi.mock("@/lib/auth/request-context", () => ({
  getAppActor: () => getAppActorMock()
}));

vi.mock("@/lib/practice/attempts", () => ({
  submitPracticeTestAttempt: (...args: unknown[]) => submitPracticeTestAttemptMock(...args)
}));

describe("/api/practice/attempts POST", () => {
  beforeEach(() => {
    getAppActorMock.mockReset();
    getAppActorMock.mockResolvedValue({ userId: "student-profile-1", role: "student", isStudent: true });
    submitPracticeTestAttemptMock.mockReset();
  });

  it("submits a valid attempt payload", async () => {
    submitPracticeTestAttemptMock.mockResolvedValue({
      attemptId: "attempt-1",
      score: 100,
      correctAnswers: 2,
      totalQuestions: 2,
      passed: true,
      passingScore: 70,
      questions: []
    });

    const { POST } = await import("@/app/api/practice/attempts/route");
    const response = await POST(
      new NextRequest("http://localhost/api/practice/attempts", {
        method: "POST",
        body: JSON.stringify({
          activityId: "test_11111111-1111-1111-1111-111111111111",
          answers: [
            {
              questionId: "22222222-2222-2222-2222-222222222222",
              optionId: "33333333-3333-3333-3333-333333333333"
            }
          ],
          timeSpentSeconds: 42
        })
      })
    );

    expect(submitPracticeTestAttemptMock).toHaveBeenCalledWith({
      activityId: "test_11111111-1111-1111-1111-111111111111",
      answers: [
        {
          questionId: "22222222-2222-2222-2222-222222222222",
          optionId: "33333333-3333-3333-3333-333333333333"
        }
      ],
      timeSpentSeconds: 42
    });
    expect(response.status).toBe(201);
  });

  it("rejects unauthenticated attempts before submit", async () => {
    getAppActorMock.mockResolvedValue(null);

    const { POST } = await import("@/app/api/practice/attempts/route");
    const response = await POST(
      new NextRequest("http://localhost/api/practice/attempts", {
        method: "POST",
        body: JSON.stringify({
          activityId: "test_11111111-1111-1111-1111-111111111111",
          answers: []
        })
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ code: "UNAUTHORIZED" });
    expect(submitPracticeTestAttemptMock).not.toHaveBeenCalled();
  });

  it("denies non-student attempts before parsing invalid JSON", async () => {
    getAppActorMock.mockResolvedValue({ userId: "teacher-profile-1", role: "teacher", isTeacher: true });

    const { POST } = await import("@/app/api/practice/attempts/route");
    const response = await POST(
      new NextRequest("http://localhost/api/practice/attempts", {
        method: "POST",
        body: "not-json"
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN", message: "Permission denied" });
    expect(submitPracticeTestAttemptMock).not.toHaveBeenCalled();
  });

  it("rejects invalid payloads before submit", async () => {
    const { POST } = await import("@/app/api/practice/attempts/route");
    const response = await POST(
      new NextRequest("http://localhost/api/practice/attempts", {
        method: "POST",
        body: JSON.stringify({
          activityId: "lesson_bad",
          answers: []
        })
      })
    );

    expect(submitPracticeTestAttemptMock).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_ERROR"
    });
  });
});
