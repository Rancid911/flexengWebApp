import { describe, expect, it } from "vitest";

import { resolveWorkspaceShellOptions } from "@/app/(workspace)/workspace-shell-options";

describe("resolveWorkspaceShellOptions", () => {
  it("returns lazy search and notifications for shared and staff shells", () => {
    expect(resolveWorkspaceShellOptions({ shellVariant: "shared" }).utilitySlots).toEqual({
      search: "lazy",
      notifications: "lazy"
    });
    expect(resolveWorkspaceShellOptions({ shellVariant: "staff" }).utilitySlots).toEqual({
      search: "lazy",
      notifications: "lazy"
    });
  });

  it("returns notifications only for student and teacher shells", () => {
    expect(resolveWorkspaceShellOptions({ shellVariant: "student" }).utilitySlots).toEqual({
      search: "none",
      notifications: "lazy"
    });
    expect(resolveWorkspaceShellOptions({ shellVariant: "teacher" }).utilitySlots).toEqual({
      search: "none",
      notifications: "lazy"
    });
  });

  it("disables header search on the search route", () => {
    expect(resolveWorkspaceShellOptions({ shellVariant: "shared", pathname: "/search" }).utilitySlots).toEqual({
      search: "none",
      notifications: "lazy"
    });
  });
});
