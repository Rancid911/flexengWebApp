#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

function gitFiles(args = []) {
  const output = execFileSync("git", ["ls-files", ...args], { cwd: root, encoding: "utf8" });
  return output.split("\n").filter(Boolean);
}

function read(file) {
  return readFileSync(join(root, file), "utf8");
}

function hasRawDbAccess(source) {
  return /\bcreateAdminClient\b/.test(source) || /(?<!Array)\.from\s*\(/.test(source) || /\.rpc\s*\(/.test(source);
}

function fail(file, message) {
  failures.push(`${file}: ${message}`);
}

const trackedFiles = gitFiles();

for (const file of trackedFiles) {
  if (file.endsWith(".DS_Store")) {
    fail(file, "tracked .DS_Store files are not allowed");
  }
  if (/queries\.legacy\./.test(file)) {
    fail(file, "legacy query files are not allowed");
  }
}

for (const file of trackedFiles.filter((item) => /^(app|lib|tests)\//.test(item) && /\.(ts|tsx|js|jsx|md)$/.test(item))) {
  const source = read(file);
  if (/queries\.legacy/.test(source)) {
    fail(file, "references queries.legacy");
  }
}

for (const file of trackedFiles.filter((item) => item.startsWith("app/api/") && item.endsWith("/route.ts"))) {
  const source = read(file);
  if (hasRawDbAccess(source)) {
    fail(file, "API routes must not call createAdminClient, .from(), or .rpc() directly; move access to service/query/repository layer");
  }
}

for (const file of trackedFiles.filter((item) => item.startsWith("app/") && item.endsWith("/page.tsx"))) {
  const source = read(file);
  if (/\bcreateAdminClient\b/.test(source)) {
    fail(file, "server pages must not create admin clients directly; move reads to focused page queries");
  }
}

for (const file of trackedFiles.filter((item) => item.startsWith("lib/") && item.endsWith(".repository.ts"))) {
  const source = read(file);
  const forbidden = [
    ["NextRequest", /\bNextRequest\b/],
    ["NextResponse", /\bNextResponse\b/],
    ["React imports", /from\s+["']react["']/],
    ["app imports", /from\s+["']@\/app\//],
    ["writeAudit", /\bwriteAudit\b/]
  ];
  for (const [label, pattern] of forbidden) {
    if (pattern.test(source)) {
      fail(file, `repository contains transport/UI/business dependency: ${label}`);
    }
  }
}

const clientSupabaseAllowlist = new Set([
  "app/(auth)/forgot-password/page.tsx",
  "app/(auth)/login/page.tsx",
  "app/(auth)/register/page.tsx",
  "app/(auth)/reset-password/page.tsx",
  "app/(workspace)/(shared-zone)/settings/use-settings-form-state.ts",
  "app/(workspace)/(staff-zone)/crm/use-crm-settings-state.ts",
  "app/(workspace)/use-dashboard-shell-state.ts"
]);

for (const file of trackedFiles.filter((item) => /^(app|components|hooks)\//.test(item) && /\.(ts|tsx)$/.test(item))) {
  const source = read(file);
  if (!source.includes("use client")) continue;
  const usesSupabaseClient = /@\/lib\/supabase\/(client|browser)/.test(source) || /\bcreateClient\s*\(/.test(source) || /(?<!Array)\.from\s*\(/.test(source) || /storage\.from\s*\(/.test(source);
  if (usesSupabaseClient && !clientSupabaseAllowlist.has(file)) {
    fail(file, "client UI uses Supabase/raw DB access outside the explicit auth/settings/avatar/CRM storage allowlist");
  }
}

if (failures.length > 0) {
  console.error("Architecture check failed:\n");
  for (const item of failures) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

console.log("Architecture check passed.");
