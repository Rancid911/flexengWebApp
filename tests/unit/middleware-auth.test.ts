import { describe, expect, it } from "vitest";

import { isOptionalAuthApiPath, isProtectedApiPath, isProtectedAppPath } from "@/lib/supabase/middleware";

describe("middleware auth zoning", () => {
  it("treats expanded app zones as protected", () => {
    expect(isProtectedAppPath("/dashboard")).toBe(true);
    expect(isProtectedAppPath("/schedule")).toBe(true);
    expect(isProtectedAppPath("/students/student-1")).toBe(true);
    expect(isProtectedAppPath("/search")).toBe(false);
    expect(isProtectedAppPath("/student-dashboard")).toBe(true);
    expect(isProtectedAppPath("/articles")).toBe(false);
  });

  it("protects auth-sensitive api namespaces but leaves webhook public", () => {
    expect(isProtectedApiPath("/api/admin/users")).toBe(true);
    expect(isProtectedApiPath("/api/schedule")).toBe(true);
    expect(isProtectedApiPath("/api/search")).toBe(false);
    expect(isOptionalAuthApiPath("/api/search")).toBe(true);
    expect(isOptionalAuthApiPath("/api/search/suggestions")).toBe(false);
    expect(isProtectedApiPath("/api/payments")).toBe(true);
    expect(isProtectedApiPath("/api/payments/yookassa/webhook")).toBe(false);
  });
});
