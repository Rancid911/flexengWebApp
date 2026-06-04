import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260604223000_reliable_user_provisioning.sql"),
  "utf8"
);
const reconciliationMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260604233000_reconcile_provision_role_metadata_updates.sql"),
  "utf8"
);

describe("reliable user provisioning migration", () => {
  it("derives authorization role only from protected app metadata with a student fallback", () => {
    expect(migration).toContain("new.raw_app_meta_data ->> 'provision_role'");
    expect(migration).toContain("'student'");
    expect(migration).not.toMatch(/raw_user_meta_data\s*->>\s*'role'/);
    expect(migration).toContain("v_role not in ('student', 'teacher', 'manager', 'admin')");
  });

  it("reconciles admin app metadata written after the initial auth insert", () => {
    expect(reconciliationMigration).toContain("after update of raw_app_meta_data on auth.users");
    expect(reconciliationMigration).toContain("public.apply_user_provisioning");
    expect(reconciliationMigration).toContain("delete from public.user_roles");
    expect(reconciliationMigration).toContain("delete from public.students");
    expect(reconciliationMigration).toContain("delete from public.teachers");
    expect(reconciliationMigration).not.toMatch(/raw_user_meta_data\s*->>\s*'role'/);
  });

  it("creates RBAC and linked identity rows inside the auth trigger", () => {
    expect(migration).toContain("insert into public.user_roles");
    expect(migration).toContain("insert into public.students (profile_id)");
    expect(migration).toContain("insert into public.teachers (profile_id)");
    expect(migration).toContain("create trigger on_auth_user_created");
  });

  it("keeps the security-definer trigger closed to direct callers", () => {
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain("revoke all on function public.handle_new_user() from public");
    expect(migration).toContain("revoke all on function public.handle_new_user() from anon");
    expect(migration).toContain("revoke all on function public.handle_new_user() from authenticated");
  });
});
