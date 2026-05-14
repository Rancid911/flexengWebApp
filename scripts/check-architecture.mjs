#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
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

const apiPermissionExceptionReasons = new Map([
  ["app/api/auth/login/route.ts", "public auth credential exchange endpoint"],
  ["app/api/auth/signup/route.ts", "public auth registration endpoint"],
  ["app/api/auth/logout/route.ts", "self auth session logout endpoint"],
  ["app/api/auth/me/route.ts", "self auth session introspection endpoint"],
  ["app/api/auth/password/reset-request/route.ts", "public auth password reset request endpoint"],
  ["app/api/auth/password/update/route.ts", "auth recovery session password update endpoint"],
  ["app/api/blog/meta/route.ts", "public blog metadata read endpoint"],
  ["app/api/blog/posts/route.ts", "public blog posts read endpoint"],
  ["app/api/blog/posts/[slug]/route.ts", "public blog post detail read endpoint"],
  ["app/api/leads/route.ts", "public marketing lead intake endpoint"],
  ["app/api/search/route.ts", "public/workspace read-model endpoint with service-level visibility filtering"],
  ["app/api/payments/yookassa/webhook/route.ts", "provider-authenticated YooKassa webhook"],
  ["app/api/request-context/invalidate/route.ts", "internal self cache utility with minimal auth check"]
]);

function fail(file, message) {
  failures.push(`${file}: ${message}`);
}

const trackedFiles = gitFiles();
const existingTrackedFiles = trackedFiles.filter((file) => existsSync(join(root, file)));
const untrackedFiles = gitFiles(["--others", "--exclude-standard"]);
const projectFiles = Array.from(new Set([...existingTrackedFiles, ...untrackedFiles]));
const appRouteConventionFiles = new Set([
  "page.tsx",
  "layout.tsx",
  "loading.tsx",
  "error.tsx",
  "not-found.tsx",
  "route.ts",
  "template.tsx",
  "default.tsx",
  "global-error.tsx"
]);

const tailwindConfigPath = "tailwind.config.ts";
if (existsSync(join(root, tailwindConfigPath))) {
  const tailwindConfig = read(tailwindConfigPath);
  const requiredTailwindContentRoots = ["app", "components", "features", "shared"];
  for (const contentRoot of requiredTailwindContentRoots) {
    if (!tailwindConfig.includes(`./${contentRoot}/**/*.{ts,tsx}`)) {
      fail(tailwindConfigPath, `Tailwind content must scan ./${contentRoot}/**/*.{ts,tsx}`);
    }
  }
}

for (const file of projectFiles) {
  if (file.endsWith(".DS_Store")) {
    fail(file, "tracked .DS_Store files are not allowed");
  }
  if (/queries\.legacy\./.test(file)) {
    fail(file, "legacy query files are not allowed");
  }
}

for (const file of projectFiles.filter((item) => item.startsWith("app/") && !item.startsWith("app/api/") && /\.(ts|tsx)$/.test(item))) {
  const fileName = file.split("/").pop();
  if (!appRouteConventionFiles.has(fileName)) {
    fail(file, "app/ is routing-only; move feature/client/server implementation files to features/*, shared/*, or lib/*");
  }
}

for (const file of projectFiles.filter((item) => /^(app|features|lib|tests)\//.test(item) && /\.(ts|tsx|js|jsx|md)$/.test(item))) {
  const source = read(file);
  if (/queries\.legacy/.test(source)) {
    fail(file, "references queries.legacy");
  }
}

for (const file of projectFiles.filter((item) => item.startsWith("app/api/") && item.endsWith("/route.ts"))) {
  const source = read(file);
  if (hasRawDbAccess(source)) {
    fail(file, "API routes must not call createAdminClient, .from(), or .rpc() directly; move access to service/query/repository layer");
  }
  if (!/\brequirePermission\s*\(/.test(source) && !apiPermissionExceptionReasons.has(file)) {
    fail(file, "protected API routes must call requirePermission(); public/provider/internal exceptions must be explicit in check-architecture.mjs");
  }
}

for (const file of projectFiles.filter((item) => item.startsWith("app/") && item.endsWith("/page.tsx"))) {
  const source = read(file);
  if (/\bcreateAdminClient\b/.test(source)) {
    fail(file, "server pages must not create admin clients directly; move reads to focused page queries");
  }
}

for (const file of projectFiles.filter((item) => item.startsWith("lib/") && item.endsWith(".repository.ts"))) {
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

const clientSupabaseAllowlist = new Set([]);

for (const file of projectFiles.filter((item) => /^(app|components|features|hooks)\//.test(item) && /\.(ts|tsx)$/.test(item))) {
  const source = read(file);
  if (!source.includes("use client")) continue;
  const usesSupabaseClient = /@\/lib\/supabase\/(client|browser)/.test(source) || /\bcreateClient\s*\(/.test(source) || /(?<!Array)\.from\s*\(/.test(source) || /storage\.from\s*\(/.test(source);
  if (usesSupabaseClient && !clientSupabaseAllowlist.has(file)) {
    fail(file, "client UI uses Supabase/raw DB access; use same-origin API/service boundaries instead");
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
