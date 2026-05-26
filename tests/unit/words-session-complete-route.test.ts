import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getAppActorMock = vi.fn();
const completeWordSessionMock = vi.fn();

vi.mock("@/lib/auth/request-context", () => ({
  getAppActor: () => getAppActorMock()
}));

vi.mock("@/lib/words/queries", () => ({
  completeWordSession: (...args: unknown[]) => completeWordSessionMock(...args)
}));

describe("/api/words/sessions/complete POST", () => {
  beforeEach(() => {
    getAppActorMock.mockReset();
    getAppActorMock.mockResolvedValue({
      userId: "student-profile-1",
      role: "student",
      profileRole: "student",
      isStudent: true,
      studentId: "student-1",
      rbacRoles: ["student"],
      rbacPermissions: ["word_cards.train"],
      rbacPermissionScopes: {
        "word_cards.train": ["own"]
      }
    });
    completeWordSessionMock.mockReset();
  });

  it("completes a word session for an RBAC-granted real student actor", async () => {
    completeWordSessionMock.mockResolvedValue({
      total: 1,
      mastered: 1,
      addedDifficult: 0
    });

    const { POST } = await import("@/app/api/words/sessions/complete/route");
    const response = await POST(
      new NextRequest("http://localhost/api/words/sessions/complete", {
        method: "POST",
        body: JSON.stringify({
          answers: [{ wordId: "word-1", result: "known" }]
        })
      })
    );

    expect(response.status).toBe(201);
    expect(completeWordSessionMock).toHaveBeenCalledWith([{ wordId: "word-1", result: "known" }]);
    await expect(response.json()).resolves.toEqual({ total: 1, mastered: 1, addedDifficult: 0 });
  });

  it("completes a word session for loaded RBAC student actors with own train scope", async () => {
    getAppActorMock.mockResolvedValue({
      userId: "student-profile-1",
      role: "student",
      profileRole: "student",
      isStudent: true,
      studentId: "student-1",
      rbacRoles: ["student"],
      rbacPermissions: ["word_cards.train"],
      rbacPermissionScopes: {
        "word_cards.train": ["own"]
      }
    });
    completeWordSessionMock.mockResolvedValue({
      total: 1,
      mastered: 1,
      addedDifficult: 0
    });

    const { POST } = await import("@/app/api/words/sessions/complete/route");
    const response = await POST(
      new NextRequest("http://localhost/api/words/sessions/complete", {
        method: "POST",
        body: JSON.stringify({
          answers: [{ wordId: "word-1", result: "known" }]
        })
      })
    );

    expect(response.status).toBe(201);
    expect(completeWordSessionMock).toHaveBeenCalledWith([{ wordId: "word-1", result: "known" }]);
  });

  it("denies loaded RBAC student actors missing train scope before parsing invalid JSON", async () => {
    getAppActorMock.mockResolvedValue({
      userId: "student-profile-1",
      role: "student",
      profileRole: "student",
      isStudent: true,
      studentId: "student-1",
      rbacRoles: ["student"],
      rbacPermissions: ["profile.view"],
      rbacPermissionScopes: {
        "profile.view": ["own"]
      }
    });

    const { POST } = await import("@/app/api/words/sessions/complete/route");
    const response = await POST(
      new NextRequest("http://localhost/api/words/sessions/complete", {
        method: "POST",
        body: "not-json"
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN" });
    expect(completeWordSessionMock).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated word sessions before service calls", async () => {
    getAppActorMock.mockResolvedValue(null);

    const { POST } = await import("@/app/api/words/sessions/complete/route");
    const response = await POST(
      new NextRequest("http://localhost/api/words/sessions/complete", {
        method: "POST",
        body: JSON.stringify({
          answers: [{ wordId: "word-1", result: "known" }]
        })
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ code: "UNAUTHORIZED" });
    expect(completeWordSessionMock).not.toHaveBeenCalled();
  });

  it("denies non-student word sessions before parsing invalid JSON", async () => {
    getAppActorMock.mockResolvedValue({ userId: "manager-1", role: "manager", isStaffAdmin: true });

    const { POST } = await import("@/app/api/words/sessions/complete/route");
    const response = await POST(
      new NextRequest("http://localhost/api/words/sessions/complete", {
        method: "POST",
        body: "not-json"
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN", message: "Real student write context required" });
    expect(completeWordSessionMock).not.toHaveBeenCalled();
  });

  it("denies teacher-primary actors with linked student rows before completing the session", async () => {
    getAppActorMock.mockResolvedValue({
      userId: "teacher-profile-1",
      role: "teacher",
      profileRole: "teacher",
      isStudent: true,
      isTeacher: true,
      studentId: "student-preview-1"
    });

    const { POST } = await import("@/app/api/words/sessions/complete/route");
    const response = await POST(
      new NextRequest("http://localhost/api/words/sessions/complete", {
        method: "POST",
        body: JSON.stringify({
          answers: [{ wordId: "word-1", result: "known" }]
        })
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN", message: "Real student write context required" });
    expect(completeWordSessionMock).not.toHaveBeenCalled();
  });

  it("rejects invalid payloads before completing the session", async () => {
    const { POST } = await import("@/app/api/words/sessions/complete/route");
    const response = await POST(
      new NextRequest("http://localhost/api/words/sessions/complete", {
        method: "POST",
        body: JSON.stringify({
          answers: [{ wordId: "", result: "known" }]
        })
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(completeWordSessionMock).not.toHaveBeenCalled();
  });
});
