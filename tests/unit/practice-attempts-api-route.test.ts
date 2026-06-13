import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { createAppActor } from "@/tests/unit/helpers/actors";

const getAppActorMock = vi.fn();
const submitPracticeTestAttemptMock = vi.fn();

vi.mock("@/lib/auth/request-context", () => ({
  getAppActor: () => getAppActorMock()
}));

vi.mock("@/lib/practice/practice-attempts.service", () => ({
  submitPracticeTestAttempt: (...args: unknown[]) => submitPracticeTestAttemptMock(...args)
}));

describe("/api/practice/attempts POST", () => {
  beforeEach(() => {
    getAppActorMock.mockReset();
    getAppActorMock.mockResolvedValue(createAppActor({
      userId: "student-profile-1",
      studentId: "student-1",
      rbacPermissions: ["homework.submit"],
      rbacPermissionScopes: {
        "homework.submit": ["own"]
      }
    }));
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
          activityId: "test_11111111-1111-4111-8111-111111111111",
          answers: [
            {
              questionId: "22222222-2222-4222-8222-222222222222",
              optionId: "33333333-3333-4333-8333-333333333333"
            }
          ],
          timeSpentSeconds: 42
        })
      })
    );

    expect(submitPracticeTestAttemptMock).toHaveBeenCalledWith({
      activityId: "test_11111111-1111-4111-8111-111111111111",
      answers: [
        {
          questionId: "22222222-2222-4222-8222-222222222222",
          optionId: "33333333-3333-4333-8333-333333333333"
        }
      ],
      timeSpentSeconds: 42
    });
    expect(response.status).toBe(201);
  });

  it("submits attempts for loaded RBAC student actors with own homework submit scope", async () => {
    getAppActorMock.mockResolvedValue(createAppActor({
      userId: "student-profile-1",
      studentId: "student-1",
      rbacPermissions: ["homework.submit"],
      rbacPermissionScopes: {
        "homework.submit": ["own"]
      }
    }));
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
          activityId: "test_11111111-1111-4111-8111-111111111111",
          answers: [
            {
              questionId: "22222222-2222-4222-8222-222222222222",
              optionId: "33333333-3333-4333-8333-333333333333"
            }
          ],
          timeSpentSeconds: 42
        })
      })
    );

    expect(submitPracticeTestAttemptMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(201);
  });

  it("denies loaded RBAC student actors missing homework submit before parsing invalid JSON", async () => {
    getAppActorMock.mockResolvedValue(createAppActor({
      userId: "student-profile-1",
      studentId: "student-1",
      rbacPermissions: ["homework.view"],
      rbacPermissionScopes: {
        "homework.view": ["own"]
      }
    }));

    const { POST } = await import("@/app/api/practice/attempts/route");
    const response = await POST(
      new NextRequest("http://localhost/api/practice/attempts", {
        method: "POST",
        body: "not-json"
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN" });
    expect(submitPracticeTestAttemptMock).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated attempts before submit", async () => {
    getAppActorMock.mockResolvedValue(null);

    const { POST } = await import("@/app/api/practice/attempts/route");
    const response = await POST(
      new NextRequest("http://localhost/api/practice/attempts", {
        method: "POST",
        body: JSON.stringify({
          activityId: "test_11111111-1111-4111-8111-111111111111",
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
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN", message: "Real student write context required" });
    expect(submitPracticeTestAttemptMock).not.toHaveBeenCalled();
  });

  it("denies teacher-primary actors with linked student rows before submit", async () => {
    getAppActorMock.mockResolvedValue({
      userId: "teacher-profile-1",
      role: "teacher",
      profileRole: "teacher",
      isStudent: true,
      isTeacher: true,
      studentId: "student-preview-1"
    });

    const { POST } = await import("@/app/api/practice/attempts/route");
    const response = await POST(
      new NextRequest("http://localhost/api/practice/attempts", {
        method: "POST",
        body: JSON.stringify({
          activityId: "test_11111111-1111-4111-8111-111111111111",
          answers: [
            {
              questionId: "22222222-2222-4222-8222-222222222222",
              optionId: "33333333-3333-4333-8333-333333333333"
            }
          ],
          timeSpentSeconds: 42
        })
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN", message: "Real student write context required" });
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
