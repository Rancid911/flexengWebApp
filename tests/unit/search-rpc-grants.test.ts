import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SEARCH_RPC_SIGNATURE =
  "public.search_documents_query_for_actor(text, integer, text, boolean, text, text[], uuid, uuid, uuid[])";

function readProjectFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("search RPC grants", () => {
  it("grants anon execute only on the hardened actor-scoped search RPC signature", () => {
    const migration = readProjectFile("supabase/migrations/20260525120000_search_rpc_anon_execute_grant.sql");

    expect(migration).toContain("grant execute on function public.search_documents_query_for_actor");
    expect(migration).toContain(") to anon;");
    expect(migration).toContain("auth.uid() = null");
    expect(migration).not.toMatch(/grant execute on function public\.admin_dashboard_metrics/i);
  });

  it("keeps the RPC hardening smoke aligned with anon public-only search", () => {
    const smoke = readProjectFile("supabase/sql-editor/rpc_hardening_smoke_20260521.sql");

    expect(smoke).toContain(`has_function_privilege('anon', '${SEARCH_RPC_SIGNATURE}', 'EXECUTE')`);
    expect(smoke).toContain("anon caller gets public-only search results even with spoofed privileged parameters");
    expect(smoke).toContain("search RPC is executable by anon and authenticated");
    expect(smoke).toContain("dashboard metrics RPC is not executable by anon and is executable by authenticated");
  });
});
