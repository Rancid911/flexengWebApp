import { describe, expect, it } from "vitest";

import { adminUserCreateSchema } from "@/lib/admin/validation";

describe("admin user creation validation", () => {
  it("allows creating a student before optional academic profile fields are completed", () => {
    const result = adminUserCreateSchema.safeParse({
      role: "student",
      first_name: "New",
      last_name: "Student",
      email: "student@example.com",
      password: "Password123!",
      phone: "+79990000000",
      birth_date: null,
      english_level: null,
      target_level: null,
      learning_goal: null,
      notes: null,
      assigned_teacher_id: null,
      billing_mode: null,
      lesson_price_amount: null
    });

    expect(result.success).toBe(true);
  });
});
