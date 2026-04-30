import { describe, expect, it } from "vitest";

import {
  adminActiveTabClassName,
  adminInactiveTabClassName,
  adminPrimaryButtonClassName
} from "@/app/(workspace)/(staff-zone)/admin/ui/admin-button-tokens";

describe("adminPrimaryButtonClassName", () => {
  it("matches the schedule primary button colors", () => {
    expect(adminPrimaryButtonClassName).toContain("bg-[#1f7aff]");
    expect(adminPrimaryButtonClassName).toContain("hover:bg-[#1669db]");
    expect(adminPrimaryButtonClassName).toContain("text-white");
    expect(adminPrimaryButtonClassName).toContain("font-black");
  });
});

describe("admin tab color tokens", () => {
  it("uses the soft blue active state", () => {
    expect(adminActiveTabClassName).toContain("bg-[#eaf3ff]");
    expect(adminActiveTabClassName).toContain("text-[#1669db]");
    expect(adminActiveTabClassName).toContain("border-[#b8d4ff]");
    expect(adminActiveTabClassName).toContain("hover:bg-[#deedff]");
  });

  it("keeps inactive tabs neutral", () => {
    expect(adminInactiveTabClassName).toContain("bg-slate-100");
    expect(adminInactiveTabClassName).toContain("text-slate-700");
    expect(adminInactiveTabClassName).toContain("hover:bg-slate-200");
  });
});
