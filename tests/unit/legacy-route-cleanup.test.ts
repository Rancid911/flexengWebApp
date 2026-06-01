import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const legacyRoutes = [
  "/tests",
  "/learning",
  "/assignments",
  "/flashcards",
  "/student-dashboard",
  "/words/my",
  "/about",
  "/faq",
  "/support"
];

const scannedRoots = ["app", "features", "lib", "shared"];
const removedRouteFiles = [
  "app/(workspace)/(student-zone)/tests/page.tsx",
  "app/(workspace)/(student-zone)/learning/page.tsx",
  "app/(workspace)/(student-zone)/assignments/page.tsx",
  "app/(workspace)/(student-zone)/flashcards/page.tsx",
  "app/(workspace)/(student-zone)/student-dashboard/page.tsx",
  "app/(workspace)/(student-zone)/student-dashboard/loading.tsx",
  "app/(workspace)/(shared-zone)/words/my/page.tsx",
  "app/(workspace)/(shared-zone)/words/my/loading.tsx",
  "app/(public)/about/page.tsx",
  "app/(public)/faq/page.tsx",
  "app/(public)/support/page.tsx"
];

function collectSourceFiles(directory: string): string[] {
  const entries = readdirSync(join(process.cwd(), directory));
  return entries.flatMap((entry) => {
    const relativePath = `${directory}/${entry}`;
    const absolutePath = join(process.cwd(), relativePath);
    const stat = statSync(absolutePath);

    if (stat.isDirectory()) return collectSourceFiles(relativePath);

    return /\.(ts|tsx)$/.test(entry) ? [relativePath] : [];
  });
}

describe("legacy route cleanup", () => {
  it("keeps removed legacy route files absent", () => {
    expect(removedRouteFiles.filter((filePath) => existsSync(join(process.cwd(), filePath)))).toEqual([]);
  });

  it("does not reintroduce removed legacy routes as exact internal URLs", () => {
    const exactLegacyRoutePattern = new RegExp(`(["'\`])(${legacyRoutes.map((route) => route.replace("/", "\\/")).join("|")})\\1`);
    const violations = scannedRoots
      .flatMap(collectSourceFiles)
      .flatMap((filePath) => {
        const source = readFileSync(join(process.cwd(), filePath), "utf8");
        return source.match(exactLegacyRoutePattern) ? [filePath] : [];
      });

    expect(violations).toEqual([]);
  });
});
