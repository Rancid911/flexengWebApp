import { describe, expect, it } from "vitest";

import {
  parseSidebarCollapsedCookie,
  serializeSidebarCollapsed,
  SIDEBAR_COLLAPSED_PERSISTENCE_KEY
} from "@/lib/dashboard/sidebar-persistence";

describe("sidebar persistence helpers", () => {
  it("keeps the shared persistence key stable", () => {
    expect(SIDEBAR_COLLAPSED_PERSISTENCE_KEY).toBe("flexengSidebarCollapsed");
  });

  it("parses persisted cookie values", () => {
    expect(parseSidebarCollapsedCookie("1")).toBe(true);
    expect(parseSidebarCollapsedCookie("0")).toBe(false);
    expect(parseSidebarCollapsedCookie(undefined)).toBeNull();
    expect(parseSidebarCollapsedCookie("unexpected")).toBeNull();
  });

  it("serializes sidebar state to cookie-safe values", () => {
    expect(serializeSidebarCollapsed(true)).toBe("1");
    expect(serializeSidebarCollapsed(false)).toBe("0");
  });
});
