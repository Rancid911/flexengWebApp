import { describe, expect, it, vi } from "vitest";

import {
  ADMIN_PROFILE_SELECT,
  createAuthUser,
  readCreatedProfileById,
  readProfileById,
  updateProvisionedStudentDetails,
  type AdminSupabaseClient
} from "@/lib/admin/user.repository";

type SelectCall = [fields: string];

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
    const selectCalls = query.select.mock.calls as unknown as SelectCall[];
    expect(selectCalls[0]?.[0]).not.toContain("*");
    expect(query.eq).toHaveBeenCalledWith("id", "user-1");
    expect(query.single).toHaveBeenCalledTimes(1);
  });

  it("reads a created profile with the same explicit hydration-compatible fields", async () => {
    const { query, supabase } = createProfilesSelectMock();

    await readCreatedProfileById(supabase, "user-2");

    expect(supabase.from).toHaveBeenCalledWith("profiles");
    expect(query.select).toHaveBeenCalledWith(ADMIN_PROFILE_SELECT);
    const selectCalls = query.select.mock.calls as unknown as SelectCall[];
    expect(selectCalls[0]?.[0]).not.toContain("*");
    expect(query.eq).toHaveBeenCalledWith("id", "user-2");
    expect(query.single).toHaveBeenCalledTimes(1);
  });
});

describe("admin user provisioning repository", () => {
  it("passes the trusted provisioning role through auth app_metadata", async () => {
    const createUser = vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    const supabase = { auth: { admin: { createUser } } } as unknown as AdminSupabaseClient;

    await createAuthUser(supabase, {
      email: "teacher@example.com",
      password: "Password123!",
      role: "teacher"
    });

    expect(createUser).toHaveBeenCalledWith({
      email: "teacher@example.com",
      password: "Password123!",
      email_confirm: true,
      app_metadata: { provision_role: "teacher" }
    });
  });

  it("updates the student identity created by the auth trigger instead of inserting another row", async () => {
    const query = {
      update: vi.fn(() => query),
      eq: vi.fn(() => query),
      select: vi.fn(() => query),
      single: vi.fn().mockResolvedValue({ data: { id: "student-1" }, error: null })
    };
    const from = vi.fn(() => query);
    const supabase = { from } as unknown as AdminSupabaseClient;

    await updateProvisionedStudentDetails(supabase, {
      profileId: "profile-1",
      birthDate: "2000-01-01",
      englishLevel: "A1",
      targetLevel: "B1",
      learningGoal: "Conversation",
      notes: null
    });

    expect(from).toHaveBeenCalledWith("students");
    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ english_level: "A1" }));
    expect(query.eq).toHaveBeenCalledWith("profile_id", "profile-1");
  });
});
