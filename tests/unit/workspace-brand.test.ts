import { describe, expect, it } from "vitest";

import { getWorkspaceBrandStyles } from "@/app/(workspace)/shell/workspace-brand";

describe("getWorkspaceBrandStyles", () => {
  it("keeps the purple brand contract for students", () => {
    const styles = getWorkspaceBrandStyles("student");

    expect(styles.iconContainerClassName).toContain("#4e44d4");
    expect(styles.titleClassName).toContain("text-indigo-700");
    expect(styles.focusRingClassName).toContain("focus-visible:ring-indigo-300");
  });

  it("uses the blue brand contract for teacher and staff roles", () => {
    for (const role of ["teacher", "manager", "admin"] as const) {
      const styles = getWorkspaceBrandStyles(role);

      expect(styles.iconContainerClassName).toContain("#0f172a");
      expect(styles.titleClassName).toContain("text-[#1f3d7a]");
      expect(styles.focusRingClassName).toContain("focus-visible:ring-[#88a8e8]");
    }
  });
});
