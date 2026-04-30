import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PROJECT_ROOT = "/Users/anton/Desktop/Флексенг/6. Инфра-ра/Pencil/dashboard-next/dashboard-next-next16";
const MODULES_REQUIRING_MARKERS = [
  "lib/admin/audit.ts",
  "lib/admin/payments-control.ts",
  "lib/auth/request-context.ts",
  "lib/billing/server.ts",
  "lib/dashboard/student-dashboard.ts",
  "lib/payments/server.ts",
  "lib/schedule/queries.ts",
  "lib/search/sources/search-documents.ts",
  "lib/teacher-workspace/queries.ts"
];

describe("createAdminClient access markers", () => {
  it("keeps explicit AccessMode markers on privileged or aggregate modules", () => {
    for (const relativePath of MODULES_REQUIRING_MARKERS) {
      const source = readFileSync(join(PROJECT_ROOT, relativePath), "utf8");
      expect(source, relativePath).toMatch(/AccessMode|ACCESS_MODE|ACCESS_POLIC/);
    }
  });
});
