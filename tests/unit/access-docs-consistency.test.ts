import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { SERVICE_ROLE_EXCEPTION_LIST } from "@/lib/supabase/access";

function readDoc(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const highRiskFeatureDocs = [
  "docs/features/payments-billing.md",
  "docs/features/schedule.md",
  "docs/features/search.md",
  "docs/features/crm-leads.md",
  "docs/features/students-teachers.md",
  "docs/features/notifications.md",
  "docs/features/homework-practice-tests.md",
  "docs/features/admin-users-content.md",
  "docs/features/storage-media.md"
];

const supportingFeatureDocs = [
  "docs/features/dashboard.md",
  "docs/features/settings-profile.md",
  "docs/features/words-flashcards.md",
  "docs/features/public-site-blog.md"
];

const operationsDocs = [
  "docs/operations/local-setup.md",
  "docs/operations/env-vars.md",
  "docs/operations/deployment.md",
  "docs/operations/self-hosted-supabase-readiness.md",
  "docs/operations/release-verification.md",
  "docs/operations/smoke-tests.md",
  "docs/testing/test-strategy.md"
];

const historicalDocMoves = [
  ["ARCHITECTURE_MIGRATION.md", "docs/decisions/historical/architecture-migration.md"],
  ["docs/rbac-rls-implementation-plan.md", "docs/decisions/historical/rbac-rls-implementation-plan.md"],
  ["docs/refactor-backlog.md", "docs/decisions/historical/refactor-backlog.md"],
  ["docs/performance-db-audit-phase2-2026-04-01.md", "docs/decisions/historical/performance-db-audit-phase2-2026-04-01.md"],
  ["docs/online-school-product-audit-2026-03.md", "docs/decisions/historical/online-school-product-audit-2026-03.md"],
  ["docs/online-school-delivery-plan-2026-q2.md", "docs/decisions/historical/online-school-delivery-plan-2026-q2.md"]
] as const;

describe("access-control documentation consistency", () => {
  it("keeps the central docs index and templates available", () => {
    const docsIndex = readDoc("docs/README.md");
    const requiredTemplates = [
      "docs/templates/feature-template.md",
      "docs/templates/architecture-template.md",
      "docs/templates/access-control-template.md",
      "docs/templates/api-contract-template.md",
      "docs/templates/runbook-template.md",
      "docs/templates/adr-template.md"
    ];

    expect(docsIndex).toContain("Documentation Statuses");
    expect(docsIndex).toContain("Current Source Of Truth");
    expect(docsIndex).toContain("Documentation Roadmap");

    for (const templatePath of requiredTemplates) {
      expect(existsSync(join(process.cwd(), templatePath))).toBe(true);
    }
  });

  it("keeps decisions and historical indexes discoverable", () => {
    const docsIndex = readDoc("docs/README.md");
    const decisionsIndex = readDoc("docs/decisions/README.md");
    const historicalIndex = readDoc("docs/decisions/historical/README.md");

    expect(existsSync(join(process.cwd(), "docs/decisions/README.md"))).toBe(true);
    expect(existsSync(join(process.cwd(), "docs/decisions/historical/README.md"))).toBe(true);
    expect(docsIndex).toContain("docs/decisions/README.md");
    expect(docsIndex).toContain("docs/decisions/historical/README.md");
    expect(decisionsIndex).toContain("docs/decisions/historical/README.md");
    expect(decisionsIndex).toContain("docs/templates/adr-template.md");

    for (const [oldPath, newPath] of historicalDocMoves) {
      expect(historicalIndex).toContain(oldPath);
      expect(historicalIndex).toContain(newPath);
      expect(docsIndex).toContain(newPath);
    }
  });

  it("links source-of-truth docs from the central docs index", () => {
    const docsIndex = readDoc("docs/README.md");
    const sourceDocs = [
      "docs/architecture.md",
      "docs/access-control-current-state.md",
      "docs/access-control/README.md",
      "docs/foundations-access-and-loading.md",
      "docs/service-role-inventory.md",
      "docs/storage-access-inventory.md",
      "docs/rls-smoke-harness.md",
      "docs/workspace-hard-refresh-audit.md",
      "docs/workspace-loading-skeleton-contract.md",
      "docs/schedule-actor-permission-boundary.md",
      "docs/teacher-preview-write-surface-audit.md",
      "docs/domain-map.md"
    ];

    for (const sourceDoc of sourceDocs) {
      expect(docsIndex).toContain(sourceDoc);
    }
  });

  it("keeps access-control guide docs discoverable from the central index", () => {
    const docsIndex = readDoc("docs/README.md");
    const accessDocs = [
      "docs/access-control/README.md",
      "docs/access-control/permissions.md",
      "docs/access-control/request-context.md",
      "docs/access-control/guards.md",
      "docs/access-control/service-role.md",
      "docs/access-control/storage-media.md",
      "docs/access-control/rls-rpc.md",
      "docs/access-control/verification-status.md"
    ];

    for (const accessDoc of accessDocs) {
      expect(existsSync(join(process.cwd(), accessDoc))).toBe(true);
      expect(docsIndex).toContain(accessDoc);
    }
  });

  it("keeps high-risk feature docs discoverable from the central index", () => {
    const docsIndex = readDoc("docs/README.md");

    for (const featureDoc of [...highRiskFeatureDocs, ...supportingFeatureDocs]) {
      expect(existsSync(join(process.cwd(), featureDoc))).toBe(true);
      expect(docsIndex).toContain(featureDoc);
    }
  });

  it("keeps operations and testing runbooks discoverable from the central index", () => {
    const docsIndex = readDoc("docs/README.md");

    for (const operationsDoc of operationsDocs) {
      expect(existsSync(join(process.cwd(), operationsDoc))).toBe(true);
      expect(docsIndex).toContain(operationsDoc);
    }
  });

  it("keeps high-risk feature docs on the standard feature metadata shape", () => {
    const metadataFields = [
      "Status:",
      "Audience:",
      "Owner area:",
      "Last reviewed:",
      "Source of truth:",
      "Related code:",
      "Related tests:"
    ];
    const requiredAccessLinks = [
      "docs/access-control/README.md",
      "docs/access-control/permissions.md",
      "docs/access-control/guards.md",
      "docs/access-control/request-context.md",
      "docs/access-control/rls-rpc.md",
      "docs/access-control/service-role.md",
      "docs/access-control/storage-media.md",
      "docs/access-control/verification-status.md"
    ];

    for (const featureDoc of highRiskFeatureDocs) {
      const content = readDoc(featureDoc);
      for (const field of metadataFields) {
        expect(content).toContain(field);
      }
      for (const accessLink of requiredAccessLinks) {
        expect(content).toContain(accessLink);
      }
    }
  });

  it("keeps supporting feature docs on the standard metadata and access-link shape", () => {
    const metadataFields = [
      "Status:",
      "Audience:",
      "Owner area:",
      "Last reviewed:",
      "Source of truth:",
      "Related code:",
      "Related tests:"
    ];
    const requiredAccessLinks = [
      "docs/README.md",
      "docs/access-control/README.md",
      "docs/access-control/permissions.md",
      "docs/access-control/guards.md",
      "docs/access-control/request-context.md",
      "docs/access-control/rls-rpc.md",
      "docs/access-control/verification-status.md"
    ];

    for (const featureDoc of supportingFeatureDocs) {
      const content = readDoc(featureDoc);
      for (const field of metadataFields) {
        expect(content).toContain(field);
      }
      for (const accessLink of requiredAccessLinks) {
        expect(content).toContain(accessLink);
      }
    }
  });

  it("keeps operations and testing docs on the standard metadata shape", () => {
    const metadataFields = [
      "Status:",
      "Audience:",
      "Owner area:",
      "Last reviewed:",
      "Source of truth:",
      "Related code:",
      "Related tests:"
    ];

    for (const operationsDoc of operationsDocs) {
      const content = readDoc(operationsDoc);
      for (const field of metadataFields) {
        expect(content).toContain(field);
      }
    }
  });

  it("documents operational safety boundaries without claiming live verification", () => {
    const envVars = readDoc("docs/operations/env-vars.md");
    const releaseVerification = readDoc("docs/operations/release-verification.md");
    const smokeTests = readDoc("docs/operations/smoke-tests.md");
    const testStrategy = readDoc("docs/testing/test-strategy.md");
    const combined = [envVars, releaseVerification, smokeTests, testStrategy].join("\n");

    expect(envVars).toMatch(/service-role[\s\S]{0,160}(never expose|server-only)/i);
    expect(releaseVerification).toMatch(/Static checks[\s\S]{0,160}not live DB proof/i);
    expect(smokeTests).toMatch(/Production-safe/i);
    expect(smokeTests).toMatch(/Branch\/staging\/local|branch, clone, local or staging/i);
    expect(testStrategy).toContain("npm run check:architecture");
    expect(testStrategy).toContain("tests/unit/access-docs-consistency.test.ts");
    expect(combined).not.toMatch(/live DB verification passed/i);
    expect(combined).not.toMatch(/production-verified/i);
  });

  it("keeps the non-active Supabase bootstrap bundle explicit and undiscoverable as migrations", () => {
    const cutoff = "20260612203357";
    const bootstrapRoot = join(process.cwd(), "supabase/bootstrap");
    const candidateRoot = join(bootstrapRoot, cutoff);
    const warning = [
      "-- DRAFT BASELINE CANDIDATE.",
      "-- DO NOT APPLY TO EXISTING SUPABASE CLOUD PROJECT.",
      "-- Intended only for clean local/self-hosted bootstrap rehearsal.",
      "-- This file is non-active and must not be placed into supabase/migrations."
    ].join("\n");
    const sqlFiles = [
      "schema.candidate.sql",
      "reference-data.candidate.sql",
      "verification.sql"
    ];
    const applicationWarning = [
      "-- DRAFT APPLICATION BASELINE CANDIDATE.",
      "-- DO NOT APPLY TO EXISTING SUPABASE CLOUD PROJECT.",
      "-- Intended only for clean local/self-hosted bootstrap rehearsal AFTER the Supabase platform is initialized.",
      "-- This file is non-active and must not be placed into supabase/migrations.",
      "-- Raw snapshot reference: schema.candidate.sql"
    ].join("\n");
    const applicationBaseline = readDoc(
      `supabase/bootstrap/${cutoff}/application-baseline.candidate.sql`
    );
    const manifest = readDoc(`supabase/bootstrap/${cutoff}/manifest.md`);
    const readiness = readDoc("docs/operations/self-hosted-supabase-readiness.md");

    expect(readDoc("supabase/bootstrap/README.md")).toContain("This bootstrap bundle is not an active migration.");
    expect(manifest).toContain(`Cutoff: \`${cutoff}\``);
    expect(readiness).toContain(
      "After baseline cutoff, every database change must be represented by a normal"
    );
    expect(applicationBaseline.startsWith(applicationWarning)).toBe(true);
    expect(applicationBaseline).toContain("PLACEHOLDER ONLY");
    expect(applicationBaseline).toContain("Supabase self-hosted tag: TBD");
    expect(applicationBaseline).not.toMatch(/^CREATE (SCHEMA|TABLE|FUNCTION|POLICY|TRIGGER)/m);
    expect(manifest).toContain("schema.candidate.sql`: immutable raw full-schema reference");
    expect(manifest).toContain("application-baseline.candidate.sql");
    expect(manifest).toContain("Supabase self-hosted tag | `TBD`");
    expect(readiness).toContain("schema.candidate.sql` must never be applied directly");

    for (const sqlFile of sqlFiles) {
      expect(readDoc(`supabase/bootstrap/${cutoff}/${sqlFile}`).startsWith(warning)).toBe(true);
    }

    const activeMigrationFiles = readdirSync(join(process.cwd(), "supabase/migrations"));
    expect(activeMigrationFiles.some((file) => file.includes("baseline") || file.includes("bootstrap"))).toBe(false);
    expect(existsSync(candidateRoot)).toBe(true);
  });

  it("keeps the service-role inventory aligned across code, docs, and architecture enforcement", () => {
    const expected = [
      "lib/admin/audit.ts",
      "lib/admin/user.repository.ts",
      "lib/media/service.ts",
      "lib/payments/server.ts",
      "lib/supabase/admin.ts"
    ];
    const checker = readDoc("scripts/check-architecture.mjs");
    const inventory = readDoc("docs/service-role-inventory.md");
    const checkerAllowlist = checker.match(
      /const serviceRoleAllowlist = new Map\(\[([\s\S]*?)\n\]\);/
    )?.[1];
    const checkerFiles = [...(checkerAllowlist?.matchAll(/\["([^"]+)"/g) ?? [])].map(
      (match) => match[1]
    );
    const inventoryFiles = [...inventory.matchAll(/^\| `([^`]+)` \| \d+ \|/gm)].map(
      (match) => match[1]
    );

    expect([...SERVICE_ROLE_EXCEPTION_LIST]).toEqual(expected);
    expect(checkerFiles).toEqual(expected);
    expect(inventoryFiles).toEqual(expected);
    for (const file of expected) {
      expect(inventory).toContain(`\`${file}\``);
    }
    expect(inventory).not.toContain("homework progress sync after practice attempts remains explicitly privileged");
  });

  it("keeps the current Node version aligned with package engines and CI docs", () => {
    const packageJson = JSON.parse(readDoc("package.json")) as { engines: { node: string } };
    const ci = readDoc(".github/workflows/ci.yml");
    const localSetup = readDoc("docs/operations/local-setup.md");
    const deployment = readDoc("docs/operations/deployment.md");

    expect(packageJson.engines.node).toBe("24.x");
    expect(ci.match(/node-version: 24/g)).toHaveLength(3);
    expect(ci).not.toContain("node-version: 22");
    expect(localSetup).toContain("Node.js 24.x");
    expect(deployment).toContain("Node engine: 24.x");
  });

  it("documents feature-specific high-risk boundaries without overclaiming live DB status", () => {
    const payments = readDoc("docs/features/payments-billing.md");
    const schedule = readDoc("docs/features/schedule.md");
    const search = readDoc("docs/features/search.md");
    const crm = readDoc("docs/features/crm-leads.md");
    const studentsTeachers = readDoc("docs/features/students-teachers.md");
    const notifications = readDoc("docs/features/notifications.md");
    const homeworkPracticeTests = readDoc("docs/features/homework-practice-tests.md");
    const adminUsersContent = readDoc("docs/features/admin-users-content.md");
    const storageMedia = readDoc("docs/features/storage-media.md");
    const combined = [
      payments,
      schedule,
      search,
      crm,
      studentsTeachers,
      notifications,
      homeworkPracticeTests,
      adminUsersContent,
      storageMedia
    ].join("\n");

    expect(search).toMatch(/optional-auth hybrid/i);
    expect(search).toMatch(/Guest[s]?[\s\S]{0,120}public-only/i);
    expect(schedule).toContain("ScheduleActor.accessMode");
    expect(payments).toMatch(/provider\/internal/i);
    expect(payments).toMatch(/webhook/i);
    expect(crm).toMatch(/Public lead intake/i);
    expect(crm).toMatch(/protected CRM management|CRM management is protected/i);
    expect(studentsTeachers).toMatch(/identity[\s\S]{0,120}permission grants/i);
    expect(notifications).toMatch(/RBAC role keys/i);
    expect(notifications).toMatch(/profiles\.role[\s\S]{0,120}not used/i);
    expect(homeworkPracticeTests).toMatch(/teacher preview/i);
    expect(homeworkPracticeTests).toMatch(/real-student write context|requireRealStudentWriteContext/i);
    expect(adminUsersContent).toMatch(/service-role[\s\S]{0,160}Auth admin/i);
    expect(storageMedia).toMatch(/public bucket/i);
    expect(storageMedia).toMatch(/storage metadata smoke|storage smoke/i);
    expect(combined).not.toMatch(/live DB verification passed/i);
    expect(combined).not.toMatch(/production-verified/i);
  });

  it("documents supporting feature-specific boundaries", () => {
    const dashboard = readDoc("docs/features/dashboard.md");
    const settingsProfile = readDoc("docs/features/settings-profile.md");
    const wordsFlashcards = readDoc("docs/features/words-flashcards.md");
    const publicSiteBlog = readDoc("docs/features/public-site-blog.md");
    const combined = [dashboard, settingsProfile, wordsFlashcards, publicSiteBlog].join("\n");

    expect(dashboard).toMatch(/role-specific|workspace branch/i);
    expect(dashboard).toMatch(/widgets|metrics|sections/i);
    expect(settingsProfile).toContain("docs/features/storage-media.md");
    expect(settingsProfile).toContain("docs/access-control/storage-media.md");
    expect(settingsProfile).toMatch(/profile\.view/i);
    expect(settingsProfile).toMatch(/profile\.update/i);
    expect(wordsFlashcards).toContain("docs/features/admin-users-content.md");
    expect(wordsFlashcards).toContain("docs/features/search.md");
    expect(wordsFlashcards).toMatch(/word_cards\.train/i);
    expect(publicSiteBlog).toContain("docs/features/crm-leads.md");
    expect(publicSiteBlog).toContain("docs/features/search.md");
    expect(publicSiteBlog).toMatch(/public lead/i);
    expect(publicSiteBlog).toMatch(/published/i);
    expect(combined).not.toMatch(/live DB verification passed/i);
    expect(combined).not.toMatch(/production-verified/i);
  });

  it("documents access-control invariants in the focused access docs", () => {
    const focusedAccessDocs = [
      readDoc("docs/access-control/README.md"),
      readDoc("docs/access-control/permissions.md"),
      readDoc("docs/access-control/request-context.md"),
      readDoc("docs/access-control/guards.md"),
      readDoc("docs/access-control/rls-rpc.md"),
      readDoc("docs/access-control/verification-status.md")
    ].join("\n");

    expect(focusedAccessDocs).toContain("DB RBAC -> AppActor -> can()/guards -> menu/page/API -> RLS/RPC");
    expect(focusedAccessDocs).toMatch(/profiles\.role[\s\S]{0,120}metadata/i);
    expect(focusedAccessDocs).toMatch(/Navigation visibility is UX, not security/i);
    expect(focusedAccessDocs).toMatch(/static/i);
    expect(focusedAccessDocs).toMatch(/live DB verification/i);
  });

  it("marks moved historical docs and compatibility stubs as non-runtime truth", () => {
    const docsIndex = readDoc("docs/README.md");
    const historicalIndex = readDoc("docs/decisions/historical/README.md");

    for (const [oldPath, newPath] of historicalDocMoves) {
      const oldContent = readDoc(oldPath);
      const newContent = readDoc(newPath);
      expect(newContent).toContain("Historical document. This is not current runtime truth.");
      expect(oldContent).toContain("Historical document. This is not current runtime truth.");
      expect(oldContent).toContain("Historical document moved.");
      expect(oldContent).toContain(newPath);
      expect(docsIndex).toContain(newPath);
      expect(historicalIndex).toContain(oldPath);
      expect(historicalIndex).toContain(newPath);
    }
  });

  it("keeps a central current-state entrypoint linked to focused inventories", () => {
    const currentState = readDoc("docs/access-control-current-state.md");

    expect(currentState).toContain("DB RBAC");
    expect(currentState).toContain("RequestContext / AppActor");
    expect(currentState).toContain("can() / requirePermission()");
    expect(currentState).toContain("docs/foundations-access-and-loading.md");
    expect(currentState).toContain("docs/decisions/historical/rbac-rls-implementation-plan.md");
    expect(currentState).toContain("lib/permissions/registry.ts");
    expect(currentState).toContain("tests/unit/permissions-vocabulary.test.ts");
    expect(currentState).toContain("docs/rls-smoke-harness.md");
    expect(currentState).toContain("docs/service-role-inventory.md");
    expect(currentState).toContain("docs/storage-access-inventory.md");
    expect(currentState).toContain("docs/schedule-actor-permission-boundary.md");
    expect(currentState).toContain("docs/workspace-hard-refresh-audit.md");
    expect(currentState).toContain("docs/teacher-preview-write-surface-audit.md");
  });

  it("keeps the workspace loading skeleton contract discoverable", () => {
    const foundations = readDoc("docs/foundations-access-and-loading.md");
    const loadingContract = readDoc("docs/workspace-loading-skeleton-contract.md");

    expect(foundations).toContain("docs/workspace-loading-skeleton-contract.md");
    expect(loadingContract).toContain("Workspace fallback");
    expect(loadingContract).toContain("Page fallback");
    expect(loadingContract).toContain("Section fallback");
    expect(loadingContract).toContain("Do not add route-group-level `loading.tsx`");
  });

  it("documents /api/search as optional-auth with service-level result visibility", () => {
    const currentState = readDoc("docs/access-control-current-state.md");

    expect(currentState).toContain("/api/search");
    expect(currentState).toContain("optional-auth hybrid endpoint");
    expect(currentState).toContain("guests receive public-only results");
    expect(currentState).toContain("`anon` may execute `search_documents_query_for_actor`");
    expect(currentState).toContain("`search.ui` controls search UI availability only");
  });

  it("marks historical and inventory docs with current-state backlinks", () => {
    expect(readDoc("docs/foundations-access-and-loading.md")).toContain("docs/access-control-current-state.md");
    expect(readDoc("docs/decisions/historical/rbac-rls-implementation-plan.md")).toContain("historical roadmap and decision log");
    expect(readDoc("docs/service-role-inventory.md")).toContain("docs/access-control-current-state.md");
    expect(readDoc("docs/schedule-actor-permission-boundary.md")).toContain("docs/access-control-current-state.md");
    expect(readDoc("docs/workspace-hard-refresh-audit.md")).toContain("docs/access-control-current-state.md");
    expect(readDoc("docs/architecture.md")).toContain("docs/access-control-current-state.md");
  });

  it("keeps stale access-source wording out of current-state docs", () => {
    const currentDocs = [
      readDoc("README.md"),
      readDoc("ARCHITECTURE.md"),
      readDoc("docs/access-control-current-state.md"),
      readDoc("docs/foundations-access-and-loading.md"),
      readDoc("docs/service-role-inventory.md"),
      readDoc("docs/screen-data-map-by-role.md")
    ].join("\n");

    expect(currentDocs).not.toMatch(/staff_admin capability comes from profiles\.role/i);
    expect(currentDocs).not.toMatch(/service-role backed search/i);
    expect(currentDocs).not.toMatch(/server-side admin CRUD/i);
    expect(currentDocs).not.toMatch(/current permissions layer is code-based/i);
    expect(currentDocs).not.toMatch(/\bsearch_documents_query\b(?!_for_actor)/);
    expect(currentDocs).not.toMatch(/admin\.dashboard\.read.*dashboard metrics gate/i);
  });

  it("documents compatibility boundaries as intentional current-state constraints", () => {
    const currentState = readDoc("docs/access-control-current-state.md");

    expect(currentState).toContain("Intentional Compatibility Layers");
    expect(currentState).toContain("profiles.role");
    expect(currentState).toContain("ScheduleActor.role");
    expect(currentState).toContain("Deprecated and runtime compatibility permission keys");
    expect(currentState).toContain("Service-role final exceptions");
    expect(currentState).toContain("Workspace route groups share the common workspace shell");
  });

  it("keeps teacher preview write boundary identity-based, not profileRole-based", () => {
    const teacherPreviewDoc = readDoc("docs/teacher-preview-write-surface-audit.md");

    expect(teacherPreviewDoc).not.toContain('profileRole === "student"');
    expect(teacherPreviewDoc).toContain("`profileRole` is legacy/display/diagnostic metadata");
    expect(teacherPreviewDoc).toContain("requireRealStudentWriteContext");
    expect(teacherPreviewDoc).toContain("actor.isStudent && Boolean(actor.studentId) && !actor.isTeacher");
  });
});
