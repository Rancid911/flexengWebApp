import { beforeEach, describe, expect, it, vi } from "vitest";

const createAdminClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock
}));

describe("admin audit", () => {
  beforeEach(() => {
    vi.resetModules();
    createAdminClientMock.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("writes audit entries through the service-role client", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const fromMock = vi.fn(() => ({ insert: insertMock }));
    createAdminClientMock.mockReturnValue({ from: fromMock });

    const { writeAudit } = await import("@/lib/admin/audit");

    await writeAudit({
      actorUserId: "admin-1",
      entity: "users",
      entityId: "user-1",
      action: "update",
      before: { status: "pending" },
      after: { status: "active" }
    });

    expect(createAdminClientMock).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith("audit_log");
    expect(insertMock).toHaveBeenCalledWith({
      actor_user_id: "admin-1",
      entity: "users",
      entity_id: "user-1",
      action: "update",
      before: { status: "pending" },
      after: { status: "active" }
    });
  });

  it("logs audit failures without throwing", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: { message: "insert denied" } });
    createAdminClientMock.mockReturnValue({ from: vi.fn(() => ({ insert: insertMock })) });

    const { writeAudit } = await import("@/lib/admin/audit");

    await expect(
      writeAudit({
        actorUserId: "admin-1",
        entity: "users",
        entityId: "user-1",
        action: "delete"
      })
    ).resolves.toBeUndefined();

    expect(console.error).toHaveBeenCalledWith("Failed to write audit log:", "insert denied");
  });
});
