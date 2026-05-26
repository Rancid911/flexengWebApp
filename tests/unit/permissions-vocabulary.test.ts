import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { permissions } from "@/lib/permissions";
import {
  canonicalPermissions,
  deprecatedPermissions,
  legacyPermissionAliases,
  permissionRegistry,
  rbacAuthoritativePermissionAliases,
  runtimeCompatibilityPermissions,
  runtimeOnlyPermissions
} from "@/lib/permissions/registry";

const seedMigrationPath = join(process.cwd(), "supabase/migrations/20260518120000_add_minimal_rbac_schema.sql");

function readSeededPermissionKeys() {
  const source = readFileSync(seedMigrationPath, "utf8");
  const permissionsInsert = source.match(/insert into public\.permissions \(key, category, description\)\s*values\s*([\s\S]*?)\son conflict \(key\)/);
  if (!permissionsInsert) {
    throw new Error("Could not find public.permissions seed block");
  }

  return Array.from(permissionsInsert[1].matchAll(/\('([^']+)',\s*'[^']+',\s*'[^']+'\)/g))
    .map((match) => match[1])
    .sort();
}

function findDuplicates(values: readonly string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return Array.from(duplicates).sort();
}

describe("permission vocabulary registry", () => {
  it("matches canonical permissions to the DB seed", () => {
    expect([...canonicalPermissions].sort()).toEqual(readSeededPermissionKeys());
  });

  it("classifies every code permission exactly once", () => {
    const classified = [
      ...canonicalPermissions,
      ...legacyPermissionAliases.map(([permission]) => permission),
      ...runtimeCompatibilityPermissions,
      ...runtimeOnlyPermissions,
      ...deprecatedPermissions
    ];

    expect(findDuplicates(classified)).toEqual([]);
    expect([...permissions].sort()).toEqual([...classified].sort());
  });

  it("maps every legacy alias to an existing canonical permission", () => {
    const canonical = new Set(canonicalPermissions);
    const aliasKeys = legacyPermissionAliases.map(([permission]) => permission);

    expect(findDuplicates(aliasKeys)).toEqual([]);
    for (const [alias, canonicalPermission] of legacyPermissionAliases) {
      expect(alias).not.toBe(canonicalPermission);
      expect(canonical.has(canonicalPermission)).toBe(true);
    }
  });

  it("keeps runtime-only permissions intentionally outside the DB seed", () => {
    const seeded = new Set(readSeededPermissionKeys());

    for (const permission of runtimeOnlyPermissions) {
      expect(seeded.has(permission)).toBe(false);
    }
  });

  it("classifies runtime compatibility permissions as DB-backed through aliases or dedicated can() handling", () => {
    const seeded = new Set(readSeededPermissionKeys());
    const rbacAuthoritativeKeys = new Set(rbacAuthoritativePermissionAliases.map(([permission]) => permission));
    const dedicatedCompatibilityKeys = new Set(["students.notes.read", "students.notes.write"]);

    for (const permission of runtimeCompatibilityPermissions) {
      expect(seeded.has(permission)).toBe(false);
      expect(rbacAuthoritativeKeys.has(permission) || dedicatedCompatibilityKeys.has(permission)).toBe(true);
    }
  });

  it("classifies deprecated dashboard permission as compatibility-only", () => {
    expect(runtimeOnlyPermissions).not.toContain("admin.dashboard.read");
    expect(deprecatedPermissions).toContain("admin.dashboard.read");
    expect(permissions).toContain("admin.dashboard.read");
  });

  it("keeps RBAC-authoritative aliases registered and canonical-targeted", () => {
    const registryKeys = new Set(permissions);
    const canonical = new Set(canonicalPermissions);

    for (const [permission, canonicalPermission] of rbacAuthoritativePermissionAliases) {
      expect(registryKeys.has(permission)).toBe(true);
      expect(canonical.has(canonicalPermission)).toBe(true);
    }
  });

  it("exports the same registry groups used by the vocabulary checks", () => {
    expect(permissionRegistry.canonical).toBe(canonicalPermissions);
    expect(permissionRegistry.legacyAliases).toBe(legacyPermissionAliases);
    expect(permissionRegistry.runtimeCompatibility).toBe(runtimeCompatibilityPermissions);
    expect(permissionRegistry.runtimeOnly).toBe(runtimeOnlyPermissions);
    expect(permissionRegistry.deprecated).toBe(deprecatedPermissions);
    expect(permissionRegistry.rbacAuthoritativeAliases).toBe(rbacAuthoritativePermissionAliases);
  });
});
