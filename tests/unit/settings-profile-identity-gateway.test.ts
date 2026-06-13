import { beforeEach, describe, expect, it, vi } from "vitest";

const runAuthRequestWithLockRetryMock = vi.hoisted(() =>
  vi.fn(async (callback: () => Promise<unknown>) => callback())
);

vi.mock("@/lib/supabase/auth-request", () => ({
  runAuthRequestWithLockRetry: runAuthRequestWithLockRetryMock
}));

import { createSettingsProfileIdentityGateway } from "@/lib/settings/profile-identity.gateway";

describe("settings profile identity gateway", () => {
  beforeEach(() => {
    runAuthRequestWithLockRetryMock.mockClear();
  });

  it("loads the current Auth user through the lock-retry boundary", async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: "profile-1" } },
      error: null
    });
    const gateway = createSettingsProfileIdentityGateway({
      auth: { getUser }
    } as never);

    await gateway.getCurrentUser();

    expect(runAuthRequestWithLockRetryMock).toHaveBeenCalledTimes(1);
    expect(getUser).toHaveBeenCalledTimes(1);
  });

  it("updates email with the existing confirmation redirect through lock retry", async () => {
    const updateUser = vi.fn().mockResolvedValue({
      data: { user: { id: "profile-1", email: "old@example.com" } },
      error: null
    });
    const gateway = createSettingsProfileIdentityGateway({
      auth: { updateUser }
    } as never);

    await gateway.updateEmail(
      "new@example.com",
      "https://app.example.com/auth/confirm?next=/settings/profile"
    );

    expect(runAuthRequestWithLockRetryMock).toHaveBeenCalledTimes(1);
    expect(updateUser).toHaveBeenCalledWith(
      { email: "new@example.com" },
      {
        emailRedirectTo:
          "https://app.example.com/auth/confirm?next=/settings/profile"
      }
    );
  });
});
