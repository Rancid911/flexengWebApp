import { describe, expect, it } from "vitest";

import { getPasswordPolicyErrors, validatePasswordPolicy } from "@/lib/auth/password-policy";

describe("password policy helper", () => {
  it("accepts a password that matches the Supabase policy", () => {
    expect(validatePasswordPolicy("Password123!")).toBe(true);
  });

  it("rejects passwords shorter than eight characters", () => {
    expect(getPasswordPolicyErrors("P1!a")).toContain("Пароль должен содержать минимум 8 символов.");
  });

  it("rejects passwords without lowercase letters", () => {
    expect(getPasswordPolicyErrors("PASSWORD123!")).toContain("Добавьте хотя бы одну строчную букву.");
  });

  it("rejects passwords without uppercase letters", () => {
    expect(getPasswordPolicyErrors("password123!")).toContain("Добавьте хотя бы одну заглавную букву.");
  });

  it("rejects passwords without digits", () => {
    expect(getPasswordPolicyErrors("Password!")).toContain("Добавьте хотя бы одну цифру.");
  });

  it("rejects passwords without symbols", () => {
    expect(getPasswordPolicyErrors("Password123")).toContain("Добавьте хотя бы один специальный символ.");
  });
});
