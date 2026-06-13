import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260604205057_harden_user_contact_identity_invariants.sql"),
  "utf8"
);
const report = readFileSync(
  join(process.cwd(), "supabase/sql-editor/user_contact_identity_integrity_report.sql"),
  "utf8"
);

describe("user contact and identity invariant migration", () => {
  it("enforces normalized unique profile email and Auth-backed synchronization", () => {
    expect(migration).toContain("profiles_email_normalized_uidx");
    expect(migration).toContain("lower(btrim(email))");
    expect(migration).toContain("alter column email set not null");
    expect(migration).toContain("create trigger on_auth_user_email_updated");
    expect(migration).toContain("Profile email must match Auth email");
  });

  it("keeps shared phones valid while enforcing canonical non-empty values", () => {
    expect(migration).toContain("profiles_phone_format_check");
    expect(migration).toContain("phone is null or btrim(phone) = ''");
    expect(migration).toContain("not valid");
    expect(migration).not.toContain("validate constraint profiles_phone_format_check");
    expect(migration).not.toMatch(/unique index[^;]*phone/i);
  });

  it("enforces one RBAC role and mutually exclusive linked identities", () => {
    expect(migration).toContain("user_roles_user_id_uidx");
    expect(migration).toContain("enforce_user_role_matches_profile");
    expect(migration).toContain("prevent_dual_linked_identity");
    expect(migration).toContain("Linked identity must match profile role");
    expect(migration).toContain("drop policy if exists students_insert_own_or_manage");
    expect(migration).toContain("drop policy if exists teachers_insert_manage");
    expect(migration).toContain("drop policy if exists profiles_update_policy");
  });

  it("ships a read-only integrity report for deployment checks", () => {
    expect(report).toContain("auth_profile_email_mismatches");
    expect(report).toContain("shared_phone_groups");
    expect(report).toContain("profiles_with_dual_identity");
    expect(report).not.toMatch(/\b(update|insert|delete|alter|drop|create)\b/i);
  });
});
