import { describe, expect, it } from "vitest";

import { isOptionalAuthApiPath, isProtectedApiPath, isProtectedAppPath, shouldRedirectAuthenticatedAuthPage } from "@/lib/supabase/middleware";

describe("middleware auth zoning", () => {
  it("treats expanded app zones as protected", () => {
    expect(isProtectedAppPath("/dashboard")).toBe(true);
    expect(isProtectedAppPath("/schedule")).toBe(true);
    expect(isProtectedAppPath("/students/student-1")).toBe(true);
    expect(isProtectedAppPath("/search")).toBe(false);
    expect(isProtectedAppPath("/student-dashboard")).toBe(false);
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

  it("keeps authenticated recovery users on reset password when a recovery marker exists", () => {
    expect(shouldRedirectAuthenticatedAuthPage("/reset-password", true)).toBe(false);
    expect(shouldRedirectAuthenticatedAuthPage("/reset-password", false)).toBe(true);
  });

  it("still redirects authenticated users away from ordinary auth pages", () => {
    expect(shouldRedirectAuthenticatedAuthPage("/login", true)).toBe(true);
    expect(shouldRedirectAuthenticatedAuthPage("/register", true)).toBe(true);
    expect(shouldRedirectAuthenticatedAuthPage("/forgot-password", true)).toBe(true);
  });

  it("lets the auth confirmation callback reach its route handler", () => {
    expect(isProtectedAppPath("/auth/confirm")).toBe(false);
    expect(isProtectedApiPath("/auth/confirm")).toBe(false);
    expect(isOptionalAuthApiPath("/auth/confirm")).toBe(false);
    expect(shouldRedirectAuthenticatedAuthPage("/auth/confirm", false)).toBe(false);
    expect(shouldRedirectAuthenticatedAuthPage("/auth/confirm", true)).toBe(false);
  });
});
