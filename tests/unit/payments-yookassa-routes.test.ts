import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getAppActorMock = vi.fn();
const createCheckoutForCurrentStudentMock = vi.fn();
const syncCurrentStudentTransactionMock = vi.fn();

vi.mock("@/lib/auth/request-context", () => ({
  getAppActor: () => getAppActorMock()
}));

vi.mock("@/lib/payments/server", () => ({
  createCheckoutForCurrentStudent: (...args: unknown[]) => createCheckoutForCurrentStudentMock(...args),
  syncCurrentStudentTransaction: (...args: unknown[]) => syncCurrentStudentTransactionMock(...args)
}));

describe("YooKassa student payment routes", () => {
  beforeEach(() => {
    getAppActorMock.mockReset();
    getAppActorMock.mockResolvedValue({
      userId: "student-profile-1",
      role: "student",
      isStudent: true,
      studentId: "student-1",
      rbacRoles: ["student"],
      rbacPermissions: ["payments.view"],
      rbacPermissionScopes: {
        "payments.view": ["own"]
      }
    });
    createCheckoutForCurrentStudentMock.mockReset();
    syncCurrentStudentTransactionMock.mockReset();
  });

  it("creates checkout for RBAC-granted real student actors", async () => {
    createCheckoutForCurrentStudentMock.mockResolvedValue({ transactionId: "tx-1", redirectUrl: "https://pay.example/tx-1" });

    const { POST } = await import("@/app/api/payments/yookassa/create/route");
    const response = await POST(
      new NextRequest("http://localhost/api/payments/yookassa/create", {
        method: "POST",
        body: JSON.stringify({ planId: " plan-1 " })
      })
    );

    expect(createCheckoutForCurrentStudentMock).toHaveBeenCalledWith("plan-1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ transactionId: "tx-1", redirectUrl: "https://pay.example/tx-1" });
  });

  it("creates checkout for loaded RBAC student actors with payments view", async () => {
    getAppActorMock.mockResolvedValue({
      userId: "student-profile-1",
      role: "student",
      isStudent: true,
      studentId: "student-1",
      rbacRoles: ["student"],
      rbacPermissions: ["payments.view"],
      rbacPermissionScopes: {
        "payments.view": ["own"]
      }
    });
    createCheckoutForCurrentStudentMock.mockResolvedValue({ transactionId: "tx-1", redirectUrl: "https://pay.example/tx-1" });

    const { POST } = await import("@/app/api/payments/yookassa/create/route");
    const response = await POST(
      new NextRequest("http://localhost/api/payments/yookassa/create", {
        method: "POST",
        body: JSON.stringify({ planId: "plan-1" })
      })
    );

    expect(createCheckoutForCurrentStudentMock).toHaveBeenCalledWith("plan-1");
    expect(response.status).toBe(200);
  });

  it("denies checkout for loaded RBAC student actors missing payments view before JSON parsing", async () => {
    getAppActorMock.mockResolvedValue({
      userId: "student-profile-1",
      role: "student",
      isStudent: true,
      studentId: "student-1",
      rbacRoles: ["student"],
      rbacPermissions: ["profile.view"],
      rbacPermissionScopes: {
        "profile.view": ["own"]
      }
    });

    const { POST } = await import("@/app/api/payments/yookassa/create/route");
    const response = await POST(
      new NextRequest("http://localhost/api/payments/yookassa/create", {
        method: "POST",
        body: "not-json"
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN" });
    expect(createCheckoutForCurrentStudentMock).not.toHaveBeenCalled();
  });

  it("denies checkout for non-student actors before JSON parsing", async () => {
    getAppActorMock.mockResolvedValue({ userId: "manager-1", role: "manager", isStaffAdmin: true });

    const { POST } = await import("@/app/api/payments/yookassa/create/route");
    const response = await POST(
      new NextRequest("http://localhost/api/payments/yookassa/create", {
        method: "POST",
        body: "not-json"
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN" });
    expect(createCheckoutForCurrentStudentMock).not.toHaveBeenCalled();
  });

  it("denies checkout for teacher preview actors before JSON parsing", async () => {
    getAppActorMock.mockResolvedValue({
      userId: "teacher-profile-1",
      role: "teacher",
      profileRole: "teacher",
      isTeacher: true,
      isStudent: false,
      studentId: "student-preview-1"
    });

    const { POST } = await import("@/app/api/payments/yookassa/create/route");
    const response = await POST(
      new NextRequest("http://localhost/api/payments/yookassa/create", {
        method: "POST",
        body: "not-json"
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN" });
    expect(createCheckoutForCurrentStudentMock).not.toHaveBeenCalled();
  });

  it("returns 401 for unauthenticated checkout before service calls", async () => {
    getAppActorMock.mockResolvedValue(null);

    const { POST } = await import("@/app/api/payments/yookassa/create/route");
    const response = await POST(
      new NextRequest("http://localhost/api/payments/yookassa/create", {
        method: "POST",
        body: JSON.stringify({ planId: "plan-1" })
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ code: "UNAUTHORIZED" });
    expect(createCheckoutForCurrentStudentMock).not.toHaveBeenCalled();
  });

  it("syncs payment status for RBAC-granted real student actors", async () => {
    syncCurrentStudentTransactionMock.mockResolvedValue({
      transactionId: "tx-1",
      status: "pending",
      label: "Ожидает оплаты",
      tone: "warning",
      description: "Оплата ожидает подтверждения.",
      confirmationExpiresAt: "2026-03-27T11:00:00.000Z",
      isConfirmationExpired: false
    });

    const { GET } = await import("@/app/api/payments/yookassa/status/route");
    const response = await GET(new NextRequest("http://localhost/api/payments/yookassa/status?transactionId=tx-1"));

    expect(syncCurrentStudentTransactionMock).toHaveBeenCalledWith("tx-1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ transactionId: "tx-1", status: "pending" });
  });

  it("syncs payment status for loaded RBAC student actors with payments view", async () => {
    getAppActorMock.mockResolvedValue({
      userId: "student-profile-1",
      role: "student",
      isStudent: true,
      studentId: "student-1",
      rbacRoles: ["student"],
      rbacPermissions: ["payments.view"],
      rbacPermissionScopes: {
        "payments.view": ["own"]
      }
    });
    syncCurrentStudentTransactionMock.mockResolvedValue({
      transactionId: "tx-1",
      status: "pending",
      label: "Ожидает оплаты",
      tone: "warning",
      description: "Оплата ожидает подтверждения.",
      confirmationExpiresAt: "2026-03-27T11:00:00.000Z",
      isConfirmationExpired: false
    });

    const { GET } = await import("@/app/api/payments/yookassa/status/route");
    const response = await GET(new NextRequest("http://localhost/api/payments/yookassa/status?transactionId=tx-1"));

    expect(syncCurrentStudentTransactionMock).toHaveBeenCalledWith("tx-1");
    expect(response.status).toBe(200);
  });

  it("denies status sync for loaded RBAC student actors missing payments view before service calls", async () => {
    getAppActorMock.mockResolvedValue({
      userId: "student-profile-1",
      role: "student",
      isStudent: true,
      studentId: "student-1",
      rbacRoles: ["student"],
      rbacPermissions: ["profile.view"],
      rbacPermissionScopes: {
        "profile.view": ["own"]
      }
    });

    const { GET } = await import("@/app/api/payments/yookassa/status/route");
    const response = await GET(new NextRequest("http://localhost/api/payments/yookassa/status?transactionId=tx-1"));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN" });
    expect(syncCurrentStudentTransactionMock).not.toHaveBeenCalled();
  });

  it("denies status sync for non-student actors before service calls", async () => {
    getAppActorMock.mockResolvedValue({ userId: "teacher-profile-1", role: "teacher", isTeacher: true });

    const { GET } = await import("@/app/api/payments/yookassa/status/route");
    const response = await GET(new NextRequest("http://localhost/api/payments/yookassa/status?transactionId=tx-1"));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN" });
    expect(syncCurrentStudentTransactionMock).not.toHaveBeenCalled();
  });

  it("denies status sync for teacher preview actors before service calls", async () => {
    getAppActorMock.mockResolvedValue({
      userId: "teacher-profile-1",
      role: "teacher",
      profileRole: "teacher",
      isTeacher: true,
      isStudent: false,
      studentId: "student-preview-1"
    });

    const { GET } = await import("@/app/api/payments/yookassa/status/route");
    const response = await GET(new NextRequest("http://localhost/api/payments/yookassa/status?transactionId=tx-1"));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN" });
    expect(syncCurrentStudentTransactionMock).not.toHaveBeenCalled();
  });

  it("returns 401 for unauthenticated status sync before service calls", async () => {
    getAppActorMock.mockResolvedValue(null);

    const { GET } = await import("@/app/api/payments/yookassa/status/route");
    const response = await GET(new NextRequest("http://localhost/api/payments/yookassa/status?transactionId=tx-1"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ code: "UNAUTHORIZED" });
    expect(syncCurrentStudentTransactionMock).not.toHaveBeenCalled();
  });
});
