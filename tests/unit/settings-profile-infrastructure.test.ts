import { describe, expect, it, vi } from "vitest";

const {
  client,
  createAvatarGatewayMock,
  createClientMock,
  createIdentityGatewayMock,
  createRepositoryMock
} = vi.hoisted(() => {
  const client = { id: "settings-client" };
  return {
    client,
    createAvatarGatewayMock: vi.fn(() => ({ kind: "avatar" })),
    createClientMock: vi.fn(async () => client),
    createIdentityGatewayMock: vi.fn(() => ({ kind: "identity" })),
    createRepositoryMock: vi.fn(() => ({ kind: "repository" }))
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock
}));

vi.mock("@/lib/settings/profile-avatar.gateway", () => ({
  createSettingsProfileAvatarGateway: createAvatarGatewayMock
}));

vi.mock("@/lib/settings/profile-identity.gateway", () => ({
  createSettingsProfileIdentityGateway: createIdentityGatewayMock
}));

vi.mock("@/lib/settings/profile.repository", () => ({
  createSettingsProfileRepository: createRepositoryMock
}));

import { createSettingsProfileInfrastructure } from "@/lib/settings/profile.infrastructure";

describe("settings profile infrastructure", () => {
  it("composes all boundaries from one user-scoped client", async () => {
    await expect(createSettingsProfileInfrastructure()).resolves.toEqual({
      avatarGateway: { kind: "avatar" },
      identityGateway: { kind: "identity" },
      repository: { kind: "repository" }
    });

    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(createAvatarGatewayMock).toHaveBeenCalledWith(client);
    expect(createIdentityGatewayMock).toHaveBeenCalledWith(client);
    expect(createRepositoryMock).toHaveBeenCalledWith(client);
  });
});
