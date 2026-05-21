import { beforeEach, describe, expect, it, vi } from "vitest";

const createAdminClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock
}));

function makeAdminClient(options: {
  profile?: Record<string, unknown> | null;
  crmSettings?: Record<string, unknown> | null;
  blob?: Blob | null;
}) {
  const downloadMock = vi.fn().mockResolvedValue({
    data: options.blob ?? new Blob(["image"], { type: "image/webp" }),
    error: null
  });
  const storageFromMock = vi.fn(() => ({
    download: downloadMock
  }));
  const maybeSingleMock = vi.fn(async () => ({
    data: options.profile ?? options.crmSettings ?? null,
    error: null
  }));
  const eqMock = vi.fn(() => ({
    maybeSingle: maybeSingleMock
  }));
  const selectMock = vi.fn(() => ({
    eq: eqMock
  }));
  const fromMock = vi.fn(() => ({
    select: selectMock
  }));
  const client = {
    from: fromMock,
    storage: {
      from: storageFromMock
    }
  };

  return {
    client,
    fromMock,
    storageFromMock,
    downloadMock
  };
}

describe("media service", () => {
  beforeEach(() => {
    vi.resetModules();
    createAdminClientMock.mockReset();
  });

  it("uses the same service-role client for avatar metadata and storage download", async () => {
    const mocks = makeAdminClient({
      profile: {
        avatar_url: "https://example.supabase.co/storage/v1/object/public/avatars/profile-1/avatar.webp",
        updated_at: "2026-05-01T00:00:00.000Z"
      }
    });
    createAdminClientMock.mockReturnValue(mocks.client);

    const { loadAvatarMediaFile } = await import("@/lib/media/service");
    const result = await loadAvatarMediaFile("profile-1");

    expect(createAdminClientMock).toHaveBeenCalledTimes(1);
    expect(mocks.fromMock).toHaveBeenCalledWith("profiles");
    expect(mocks.storageFromMock).toHaveBeenCalledWith("avatars");
    expect(mocks.downloadMock).toHaveBeenCalledWith("profile-1/avatar.webp");
    expect(result).toMatchObject({
      contentType: "image/webp",
      etag: "avatar-profile-1-2026-05-01T00:00:00.000Z"
    });
  });

  it("uses the same service-role client for CRM background settings and storage download", async () => {
    const mocks = makeAdminClient({
      crmSettings: {
        background_image_url: "/api/media/crm-background?p=background%2Fcrm-board.jpg&v=1",
        updated_at: "2026-05-02T00:00:00.000Z"
      },
      blob: new Blob(["image"], { type: "image/jpeg" })
    });
    createAdminClientMock.mockReturnValue(mocks.client);

    const { loadCrmBackgroundMediaFile } = await import("@/lib/media/service");
    const result = await loadCrmBackgroundMediaFile("background/crm-board.jpg");

    expect(createAdminClientMock).toHaveBeenCalledTimes(1);
    expect(mocks.fromMock).toHaveBeenCalledWith("crm_settings");
    expect(mocks.storageFromMock).toHaveBeenCalledWith("crm-assets");
    expect(mocks.downloadMock).toHaveBeenCalledWith("background/crm-board.jpg");
    expect(result).toMatchObject({
      contentType: "image/jpeg",
      etag: "crm-background-2026-05-02T00:00:00.000Z-background/crm-board.jpg"
    });
  });

  it("returns null for mismatched explicit CRM background path without downloading", async () => {
    const mocks = makeAdminClient({
      crmSettings: {
        background_image_url: "/api/media/crm-background?p=background%2Fcrm-board.jpg&v=1",
        updated_at: "2026-05-02T00:00:00.000Z"
      }
    });
    createAdminClientMock.mockReturnValue(mocks.client);

    const { loadCrmBackgroundMediaFile } = await import("@/lib/media/service");
    const result = await loadCrmBackgroundMediaFile("background/other.jpg");

    expect(createAdminClientMock).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
    expect(mocks.storageFromMock).not.toHaveBeenCalled();
    expect(mocks.downloadMock).not.toHaveBeenCalled();
  });
});
