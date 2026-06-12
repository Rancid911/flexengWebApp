import { describe, expect, it, vi } from "vitest";

import { createSettingsProfileAvatarGateway } from "@/lib/settings/profile-avatar.gateway";

describe("settings profile avatar gateway", () => {
  it("uploads the normalized avatar to the current-user path", async () => {
    const upload = vi.fn().mockResolvedValue({ data: null, error: null });
    const fromMock = vi.fn(() => ({ upload }));
    const gateway = createSettingsProfileAvatarGateway({
      storage: { from: fromMock }
    } as never);
    const file = new Blob(["avatar"], { type: "image/png" });

    await gateway.uploadAvatar("profile-1", file);

    expect(fromMock).toHaveBeenCalledWith("avatars");
    expect(upload).toHaveBeenCalledWith("profile-1/avatar", file, {
      upsert: true,
      contentType: "image/png",
      cacheControl: "3600"
    });
  });

  it("deletes the avatar from the current-user path", async () => {
    const remove = vi.fn().mockResolvedValue({ data: null, error: null });
    const fromMock = vi.fn(() => ({ remove }));
    const gateway = createSettingsProfileAvatarGateway({
      storage: { from: fromMock }
    } as never);

    await gateway.deleteAvatar("profile-1");

    expect(fromMock).toHaveBeenCalledWith("avatars");
    expect(remove).toHaveBeenCalledWith(["profile-1/avatar"]);
  });
});
