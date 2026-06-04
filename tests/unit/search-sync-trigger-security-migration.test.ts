import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260604230000_harden_search_sync_trigger_wrappers.sql"),
  "utf8"
);

describe("search sync trigger wrapper security migration", () => {
  it("runs revoked internal sync functions with fixed definer privileges", () => {
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain("public.trg_sync_search_document_%1$I()");
    expect(migration).toContain("public.sync_search_document_%1$I");
  });

  it("does not expose trigger wrappers as directly callable RPC functions", () => {
    expect(migration).toContain("from public");
    expect(migration).toContain("from anon");
    expect(migration).toContain("from authenticated");
  });
});
