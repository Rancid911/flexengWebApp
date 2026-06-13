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
const sourceAwareMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260609120000_source_aware_user_provisioning.sql"),
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

  it("defers public signup business rows until email confirmation", () => {
    expect(sourceAwareMigration).toContain("v_source text := coalesce(nullif(p_app_meta_data ->> 'provision_source', ''), 'public_signup')");
    expect(sourceAwareMigration).toContain("v_is_confirmed boolean := p_email_confirmed_at is not null or p_confirmed_at is not null");
    expect(sourceAwareMigration).toContain("if v_source = 'public_signup' and not v_is_confirmed then");
    expect(sourceAwareMigration).toContain("return;");
    expect(sourceAwareMigration).toContain("v_role := coalesce(nullif(p_app_meta_data ->> 'provision_role', ''), 'student')");
    expect(sourceAwareMigration).not.toMatch(/raw_user_meta_data\s*->>\s*'role'/);
    expect(sourceAwareMigration).not.toMatch(/raw_user_meta_data\s*->>\s*'provision_source'/);
  });

  it("provisions public signup through a confirmation update trigger", () => {
    expect(sourceAwareMigration).toContain("create or replace function public.handle_user_confirmation_provisioning()");
    expect(sourceAwareMigration).toContain("old.email_confirmed_at is null");
    expect(sourceAwareMigration).toContain("new.email_confirmed_at is not null");
    expect(sourceAwareMigration).toContain("old.confirmed_at is null");
    expect(sourceAwareMigration).toContain("new.confirmed_at is not null");
    expect(sourceAwareMigration).toContain("after update of email_confirmed_at, confirmed_at on auth.users");
    expect(sourceAwareMigration).toContain("for each row execute function public.handle_user_confirmation_provisioning()");
  });

  it("keeps admin create immediate and source-aware", () => {
    expect(sourceAwareMigration).toContain("if v_source = 'admin_create' then");
    expect(sourceAwareMigration).toContain("admin_create provisioning requires provision_role");
    expect(sourceAwareMigration).toContain("insert into public.user_roles");
    expect(sourceAwareMigration).toContain("if v_role = 'student' then");
    expect(sourceAwareMigration).toContain("insert into public.students (profile_id)");
    expect(sourceAwareMigration).toContain("elsif v_role = 'teacher' then");
    expect(sourceAwareMigration).toContain("insert into public.teachers (profile_id)");
    expect(sourceAwareMigration).not.toContain("delete from public.students where profile_id = p_user_id");
    expect(sourceAwareMigration).not.toContain("delete from public.teachers where profile_id = p_user_id");
  });

  it("raises on linked identity role conflicts before mutating profile or RBAC state", () => {
    const conflictCheckStart = sourceAwareMigration.indexOf("Cannot provision user % as student because teacher identity already exists");
    const profileUpsertStart = sourceAwareMigration.indexOf("insert into public.profiles");
    const rbacReconcileStart = sourceAwareMigration.indexOf("delete from public.user_roles");

    expect(conflictCheckStart).toBeGreaterThan(-1);
    expect(profileUpsertStart).toBeGreaterThan(conflictCheckStart);
    expect(rbacReconcileStart).toBeGreaterThan(conflictCheckStart);
    expect(sourceAwareMigration).toContain("from public.teachers");
    expect(sourceAwareMigration).toContain("Cannot provision user % as teacher because student identity already exists");
    expect(sourceAwareMigration).toContain("from public.students");
    expect(sourceAwareMigration).toContain("Cannot provision user % as % because linked student/teacher identity already exists");
    expect(sourceAwareMigration).toContain("using errcode = '23514'");
  });

  it("does not perform destructive linked identity deletes during provisioning", () => {
    expect(sourceAwareMigration).not.toContain("delete from public.students where profile_id = p_user_id");
    expect(sourceAwareMigration).not.toContain("delete from public.teachers where profile_id = p_user_id");
  });

  it("keeps invite provisioning separate from public signup", () => {
    expect(sourceAwareMigration).toContain("if v_source not in ('public_signup', 'admin_create', 'invite') then");
    expect(sourceAwareMigration).toContain("if v_source = 'invite' then");
    expect(sourceAwareMigration).toContain("Invite acceptance will get an explicit provisioning path later.");
  });

  it("updates auth triggers to use the source-aware function", () => {
    expect(sourceAwareMigration).toContain("new.email_confirmed_at");
    expect(sourceAwareMigration).toContain("new.confirmed_at");
    expect(sourceAwareMigration).toContain("drop trigger if exists on_auth_user_created on auth.users");
    expect(sourceAwareMigration).toContain("create trigger on_auth_user_created");
    expect(sourceAwareMigration).toContain("after insert on auth.users");
    expect(sourceAwareMigration).toContain("for each row execute function public.handle_new_user()");
    expect(sourceAwareMigration).toContain("create trigger on_auth_user_provision_metadata_updated");
    expect(sourceAwareMigration).toContain("after update of raw_app_meta_data on auth.users");
    expect(sourceAwareMigration).toContain("provision_source");
    expect(sourceAwareMigration).toContain("drop function if exists public.apply_user_provisioning(uuid, text, jsonb, jsonb)");
  });

  it("keeps the security-definer trigger closed to direct callers", () => {
    expect(sourceAwareMigration).toContain("security definer");
    expect(sourceAwareMigration).toContain("set search_path = ''");
    expect(sourceAwareMigration).toContain("revoke all on function public.handle_new_user() from public");
    expect(sourceAwareMigration).toContain("revoke all on function public.handle_new_user() from anon");
    expect(sourceAwareMigration).toContain("revoke all on function public.handle_new_user() from authenticated");
    expect(sourceAwareMigration).toContain(
      "revoke all on function public.apply_user_provisioning(uuid, text, jsonb, jsonb, timestamptz, timestamptz) from authenticated"
    );
  });
});
