import { describe, expect, it, vi } from "vitest";

import { createSettingsProfileRepository } from "@/lib/settings/profile.repository";

function makeQueryResult(data: unknown = null) {
  const result = { data, error: null };
  const builder = {
    select: vi.fn(() => builder),
    update: vi.fn(() => builder),
    upsert: vi.fn(async () => result),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => result),
    then: (resolve: (value: typeof result) => unknown) =>
      Promise.resolve(result).then(resolve),
    catch: (reject: (reason: unknown) => unknown) =>
      Promise.resolve(result).catch(reject),
    finally: (callback: () => void) => Promise.resolve(result).finally(callback)
  };
  return builder;
}

describe("settings profile repository", () => {
  it("loads profile variants and student birth date with current-user filters", async () => {
    const profiles = makeQueryResult();
    const students = makeQueryResult();
    const fromMock = vi.fn((table: string) =>
      table === "profiles" ? profiles : students
    );
    const repository = createSettingsProfileRepository({
      from: fromMock
    } as never);

    await repository.loadProfileWithBirthDate("profile-1");
    expect(profiles.select).toHaveBeenLastCalledWith(
      "first_name, last_name, phone, avatar_url, role, email, birth_date"
    );
    expect(profiles.eq).toHaveBeenLastCalledWith("id", "profile-1");

    await repository.loadProfileWithoutBirthDate("profile-1");
    expect(profiles.select).toHaveBeenLastCalledWith(
      "first_name, last_name, phone, avatar_url, role, email"
    );
    expect(profiles.eq).toHaveBeenLastCalledWith("id", "profile-1");

    await repository.loadStudentBirthDate("profile-1");
    expect(students.select).toHaveBeenCalledWith("birth_date");
    expect(students.eq).toHaveBeenCalledWith("profile_id", "profile-1");
  });

  it("writes profile fields, birth date, email and avatar URL", async () => {
    const profiles = makeQueryResult();
    const repository = createSettingsProfileRepository({
      from: vi.fn(() => profiles)
    } as never);
    const profileFields = {
      first_name: "Ann",
      last_name: "Lee",
      display_name: "Ann Lee",
      phone: "+79990000000"
    };

    await repository.updateProfileFields("profile-1", profileFields);
    await repository.updateProfileBirthDate("profile-1", "2010-01-01");
    await repository.updateProfileEmail("profile-1", "ann@example.com");
    await repository.updateProfileAvatarUrl("profile-1", "/api/media/avatar/profile-1?v=1");

    expect(profiles.update).toHaveBeenNthCalledWith(1, profileFields);
    expect(profiles.update).toHaveBeenNthCalledWith(2, {
      birth_date: "2010-01-01"
    });
    expect(profiles.update).toHaveBeenNthCalledWith(3, {
      email: "ann@example.com"
    });
    expect(profiles.update).toHaveBeenNthCalledWith(4, {
      avatar_url: "/api/media/avatar/profile-1?v=1"
    });
    expect(profiles.eq).toHaveBeenCalledTimes(4);
    expect(profiles.eq).toHaveBeenCalledWith("id", "profile-1");
  });

  it("upserts and clears the student birth-date fallback", async () => {
    const students = makeQueryResult();
    const repository = createSettingsProfileRepository({
      from: vi.fn(() => students)
    } as never);

    await repository.upsertStudentBirthDate("profile-1", "2010-01-01");
    await repository.clearStudentBirthDate("profile-1");

    expect(students.upsert).toHaveBeenCalledWith(
      { profile_id: "profile-1", birth_date: "2010-01-01" },
      { onConflict: "profile_id" }
    );
    expect(students.update).toHaveBeenCalledWith({ birth_date: null });
    expect(students.eq).toHaveBeenCalledWith("profile_id", "profile-1");
  });
});
