import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getAppActorMock = vi.fn();
const requireAdminApiPermissionMock = vi.fn();
const canReadProfileAvatarMock = vi.fn();
const loadAvatarMediaFileMock = vi.fn();
const loadCrmBackgroundMediaFileMock = vi.fn();

vi.mock("@/lib/auth/request-context", () => ({
  getAppActor: () => getAppActorMock()
}));

vi.mock("@/lib/admin/auth", () => ({
  requireAdminApiPermission: async (...args: unknown[]) => {
    const actor = await requireAdminApiPermissionMock(...args);
    const permission = args[0];
    if (actor?.role === "teacher" || (actor?.role === "manager" && (permission === "users.manage" || permission === "roles.view"))) {
      throw { status: 403, code: "FORBIDDEN", message: "Permission denied" };
    }
    return actor;
  }
}));

vi.mock("@/lib/media/service", () => ({
  canReadProfileAvatar: (...args: unknown[]) => canReadProfileAvatarMock(...args),
  loadAvatarMediaFile: (...args: unknown[]) => loadAvatarMediaFileMock(...args),
  loadCrmBackgroundMediaFile: (...args: unknown[]) => loadCrmBackgroundMediaFileMock(...args)
}));

function mediaFile(contentType = "image/png") {
  return {
    blob: new Blob(["image"], { type: contentType }),
    contentType,
    etag: "media-etag"
  };
}

function ownProfileReadActor(userId: string) {
  return {
    userId,
    role: "student",
    rbacStatus: "loaded",
    rbacPermissions: ["profile.view"],
    rbacPermissionScopes: {
      "profile.view": ["own"]
    }
  };
}

describe("media API routes", () => {
  beforeEach(() => {
    vi.resetModules();
    getAppActorMock.mockReset();
    requireAdminApiPermissionMock.mockReset();
    canReadProfileAvatarMock.mockReset();
    loadAvatarMediaFileMock.mockReset();
    loadCrmBackgroundMediaFileMock.mockReset();
  });

  it("streams own avatar with private cache headers", async () => {
    getAppActorMock.mockResolvedValue(ownProfileReadActor("profile-1"));
    canReadProfileAvatarMock.mockReturnValue(true);
    loadAvatarMediaFileMock.mockResolvedValue(mediaFile("image/png"));

    const { GET } = await import("@/app/api/media/avatar/[userId]/route");
    const response = await GET(new Request("http://localhost/api/media/avatar/profile-1"), {
      params: Promise.resolve({ userId: "profile-1" })
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toContain("private");
    expect(loadAvatarMediaFileMock).toHaveBeenCalledWith("profile-1");
  });

  it("returns 401 for avatar requests without an actor", async () => {
    getAppActorMock.mockResolvedValue(null);

    const { GET } = await import("@/app/api/media/avatar/[userId]/route");
    const response = await GET(new Request("http://localhost/api/media/avatar/profile-1"), {
      params: Promise.resolve({ userId: "profile-1" })
    });

    expect(response.status).toBe(401);
    expect(loadAvatarMediaFileMock).not.toHaveBeenCalled();
  });

  it("denies another student avatar when profile avatar access is not allowed", async () => {
    getAppActorMock.mockResolvedValue({ userId: "profile-2", role: "student" });
    canReadProfileAvatarMock.mockReturnValue(false);

    const { GET } = await import("@/app/api/media/avatar/[userId]/route");
    const response = await GET(new Request("http://localhost/api/media/avatar/profile-1"), {
      params: Promise.resolve({ userId: "profile-1" })
    });

    expect(response.status).toBe(403);
    expect(loadAvatarMediaFileMock).not.toHaveBeenCalled();
  });

  it("allows staff avatar access when the media policy allows it", async () => {
    getAppActorMock.mockResolvedValue({ userId: "admin-1", role: "admin" });
    canReadProfileAvatarMock.mockReturnValue(true);
    loadAvatarMediaFileMock.mockResolvedValue(mediaFile("image/webp"));

    const { GET } = await import("@/app/api/media/avatar/[userId]/route");
    const response = await GET(new Request("http://localhost/api/media/avatar/profile-1"), {
      params: Promise.resolve({ userId: "profile-1" })
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
  });

  it("returns 404 when an avatar object is missing", async () => {
    getAppActorMock.mockResolvedValue(ownProfileReadActor("profile-1"));
    canReadProfileAvatarMock.mockReturnValue(true);
    loadAvatarMediaFileMock.mockResolvedValue(null);

    const { GET } = await import("@/app/api/media/avatar/[userId]/route");
    const response = await GET(new Request("http://localhost/api/media/avatar/profile-1"), {
      params: Promise.resolve({ userId: "profile-1" })
    });

    expect(response.status).toBe(404);
  });

  it("streams CRM background only after CRM settings read permission", async () => {
    requireAdminApiPermissionMock.mockResolvedValue({ userId: "manager-1", role: "manager" });
    loadCrmBackgroundMediaFileMock.mockResolvedValue(mediaFile("image/jpeg"));

    const { GET } = await import("@/app/api/media/crm-background/route");
    const response = await GET(new NextRequest("http://localhost/api/media/crm-background?p=background%2Fcrm-board.jpg"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(response.headers.get("cache-control")).toContain("private");
    expect(loadCrmBackgroundMediaFileMock).toHaveBeenCalledWith("background/crm-board.jpg");
  });

  it("denies CRM background when the actor lacks CRM settings read permission", async () => {
    requireAdminApiPermissionMock.mockResolvedValue({ userId: "teacher-1", role: "teacher" });

    const { GET } = await import("@/app/api/media/crm-background/route");
    const response = await GET(new NextRequest("http://localhost/api/media/crm-background"));

    expect(response.status).toBe(403);
    expect(loadCrmBackgroundMediaFileMock).not.toHaveBeenCalled();
  });
});
