import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260612201818_atomic_practice_test_attempt_rpc.sql"
  ),
  "utf8"
);
const smoke = readFileSync(
  join(
    process.cwd(),
    "supabase/sql-editor/practice_attempt_atomic_rpc_smoke.sql"
  ),
  "utf8"
);

describe("atomic practice attempt RPC migration", () => {
  it("runs as the authenticated RLS actor with a fixed search path", () => {
    expect(migration).toContain(
      "create or replace function public.submit_practice_test_attempt("
    );
    expect(migration).toContain("security invoker");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain("auth.uid()");
    expect(migration).toContain(
      "app_private.has_permission('homework.submit', 'own')"
    );
    expect(migration).not.toContain("security definer");
    expect(migration).not.toContain("service_role");
  });

  it("derives authoritative grading and atomically inserts attempt and answers", () => {
    expect(migration).toContain("from public.test_questions q");
    expect(migration).toContain("from public.test_question_options option_row");
    expect(migration).toContain(
      "coalesce(selected_option.is_correct, false) as is_correct"
    );
    expect(migration).toContain("v_score := round(");
    expect(migration).toContain("v_passed := v_score >= v_passing_score");
    expect(migration).toContain(
      "insert into public.student_test_attempts"
    );
    expect(migration).toContain("insert into public.student_test_answers");
    expect(migration).toContain("ATTEMPT_CREATE_FAILED:");
    expect(migration).toContain("ATTEMPT_ANSWERS_SAVE_FAILED:");
  });

  it("keeps execute closed to public and anon", () => {
    expect(migration).toMatch(
      /revoke all on function public\.submit_practice_test_attempt\([\s\S]*?\) from public;/
    );
    expect(migration).toMatch(
      /revoke all on function public\.submit_practice_test_attempt\([\s\S]*?\) from anon;/
    );
    expect(migration).toMatch(
      /grant execute on function public\.submit_practice_test_attempt\([\s\S]*?\) to authenticated;/
    );
  });

  it("ships a rollback-only smoke for actors, validation, grading, and answer rollback", () => {
    expect(smoke).toContain("begin;");
    expect(smoke).toContain("set local role authenticated");
    expect(smoke).toContain("set local role anon");
    expect(smoke).toContain("Teacher attempt unexpectedly succeeded");
    expect(smoke).toContain(
      "RPC did not derive ownership from the authenticated actor"
    );
    expect(smoke).toContain("Invalid submissions created attempt rows");
    expect(smoke).toContain("force_practice_answer_failure");
    expect(smoke).toContain("Answer failure did not roll back the attempt");
    expect(smoke).toContain("Placement result mismatch");
    expect(smoke).toContain("rollback;");
  });
});
