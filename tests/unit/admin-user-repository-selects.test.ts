import { describe, expect, it, vi } from "vitest";

import { ADMIN_PROFILE_SELECT, readCreatedProfileById, readProfileById, type AdminSupabaseClient } from "@/lib/admin/user.repository";

function createProfilesSelectMock() {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    single: vi.fn(async () => ({ data: null, error: null }))
  };
  const supabase = {
    from: vi.fn(() => query)
  } as unknown as AdminSupabaseClient;

  return { query, supabase };
}

describe("admin user repository selects", () => {
  it("uses an explicit profile field list", () => {
    expect(ADMIN_PROFILE_SELECT).toContain("id");
    expect(ADMIN_PROFILE_SELECT).toContain("role");
    expect(ADMIN_PROFILE_SELECT).toContain("display_name");
    expect(ADMIN_PROFILE_SELECT).toContain("avatar_url");
    expect(ADMIN_PROFILE_SELECT).toContain("updated_at");
    expect(ADMIN_PROFILE_SELECT).not.toContain("*");
  });

  it("reads an existing profile without select star", async () => {
    const { query, supabase } = createProfilesSelectMock();

    await readProfileById(supabase, "user-1");

    expect(supabase.from).toHaveBeenCalledWith("profiles");
    expect(query.select).toHaveBeenCalledWith(ADMIN_PROFILE_SELECT);
    expect(query.select.mock.calls[0]?.[0]).not.toContain("*");
    expect(query.eq).toHaveBeenCalledWith("id", "user-1");
    expect(query.single).toHaveBeenCalledTimes(1);
  });

  it("reads a created profile with the same explicit hydration-compatible fields", async () => {
    const { query, supabase } = createProfilesSelectMock();

    await readCreatedProfileById(supabase, "user-2");

    expect(supabase.from).toHaveBeenCalledWith("profiles");
    expect(query.select).toHaveBeenCalledWith(ADMIN_PROFILE_SELECT);
    expect(query.select.mock.calls[0]?.[0]).not.toContain("*");
    expect(query.eq).toHaveBeenCalledWith("id", "user-2");
    expect(query.single).toHaveBeenCalledTimes(1);
  });
});
