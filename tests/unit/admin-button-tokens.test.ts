import { describe, expect, it } from "vitest";

import {
  workspaceActiveTabClassName,
  workspaceInactiveTabClassName,
  workspacePrimaryButtonClassName
} from "@/shared/constants/workspace-button-tokens";

describe("workspacePrimaryButtonClassName", () => {
  it("matches the schedule primary button colors", () => {
    expect(workspacePrimaryButtonClassName).toContain("bg-[#1f7aff]");
    expect(workspacePrimaryButtonClassName).toContain("hover:bg-[#1669db]");
    expect(workspacePrimaryButtonClassName).toContain("text-white");
    expect(workspacePrimaryButtonClassName).toContain("font-black");
  });
});

describe("workspace tab color tokens", () => {
  it("uses the soft blue active state", () => {
    expect(workspaceActiveTabClassName).toContain("bg-[#eaf3ff]");
    expect(workspaceActiveTabClassName).toContain("text-[#1669db]");
    expect(workspaceActiveTabClassName).toContain("border-[#b8d4ff]");
    expect(workspaceActiveTabClassName).toContain("hover:bg-[#deedff]");
  });

  it("keeps inactive tabs neutral", () => {
    expect(workspaceInactiveTabClassName).toContain("bg-slate-100");
    expect(workspaceInactiveTabClassName).toContain("text-slate-700");
    expect(workspaceInactiveTabClassName).toContain("hover:bg-slate-200");
  });
});
