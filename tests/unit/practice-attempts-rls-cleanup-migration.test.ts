import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260612203357_cleanup_practice_attempt_legacy_rls.sql"
  ),
  "utf8"
);
const smoke = readFileSync(
  join(
    process.cwd(),
    "supabase/sql-editor/practice_attempt_rls_cleanup_smoke.sql"
  ),
  "utf8"
);

const legacyPolicies = [
  "student_test_attempts_select_policy",
  "test_attempts_select_own",
  "student_test_attempts_insert_policy",
  "student_test_attempts_update_policy",
  "student_test_answers_select_policy",
  "student_test_answers_insert_policy",
  "student_test_answers_update_policy"
];

const canonicalPolicies = [
  "student_test_attempts_select_access",
  "student_test_attempts_insert_own",
  "student_test_attempts_update_own",
  "student_test_attempts_delete_own",
  "student_test_answers_select_access",
  "student_test_answers_insert_own",
  "student_test_answers_update_own",
  "student_test_answers_delete_own"
];

describe("practice attempt legacy RLS cleanup migration", () => {
  it("drops only the documented legacy attempt and answer policies", () => {
    for (const policy of legacyPolicies) {
      expect(migration).toContain(`drop policy if exists ${policy}`);
    }
    expect(migration.match(/drop policy if exists/g)).toHaveLength(
      legacyPolicies.length
    );
  });

  it("does not recreate or drop canonical app_private policies", () => {
    for (const policy of canonicalPolicies) {
      expect(migration).not.toContain(`drop policy if exists ${policy}`);
      expect(migration).not.toContain(`create policy ${policy}`);
    }
    expect(migration).not.toContain("create policy");
    expect(migration).not.toContain("create or replace function");
  });

  it("closes both tables to anon without changing authenticated grants", () => {
    expect(migration).toContain(
      "revoke all privileges on table public.student_test_attempts from anon"
    );
    expect(migration).toContain(
      "revoke all privileges on table public.student_test_answers from anon"
    );
    expect(migration).not.toMatch(/revoke[\s\S]*from authenticated/);
    expect(migration).not.toMatch(/grant[\s\S]*to authenticated/);
  });

  it("ships a rollback-only actor matrix and atomic RPC smoke", () => {
    expect(smoke).toContain("begin;");
    expect(smoke).toContain("set local role anon");
    expect(smoke).toContain("student cannot read another student''s attempt");
    expect(smoke).toContain("active assigned teacher can read attempt");
    expect(smoke).toContain("paused assignment does not grant teacher read");
    expect(smoke).toContain("manager can read all-scoped attempt");
    expect(smoke).toContain("admin direct attempt insert is denied");
    expect(smoke).toContain("manager direct answer insert is denied");
    expect(smoke).toContain("public.submit_practice_test_attempt");
    expect(smoke).toContain("rollback;");
  });
});
