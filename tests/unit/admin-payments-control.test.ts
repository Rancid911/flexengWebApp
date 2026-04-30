import { describe, expect, it } from "vitest";

import { compareAdminPaymentControlItems, mapAdminPaymentControlRow } from "@/lib/admin/payments-control";
import type { AdminPaymentControlDto } from "@/lib/admin/types";

function makeItem(id: string, overrides: Partial<AdminPaymentControlDto> = {}): AdminPaymentControlDto {
  return {
    student_id: id,
    profile_id: `profile-${id}`,
    first_name: `Student ${id}`,
    last_name: null,
    email: `${id}@example.com`,
    phone: null,
    billing_mode: "package_lessons",
    available_lesson_count: 5,
    debt_lesson_count: 0,
    debt_money_amount: 0,
    money_remainder_amount: 0,
    lesson_price_amount: null,
    effective_lesson_price_amount: 1500,
    billing_currency: "RUB",
    billing_not_configured: false,
    requires_attention: false,
    billing_is_negative: false,
    balance_label: "5 уроков",
    debt_label: null,
    ...overrides
  };
}

describe("compareAdminPaymentControlItems", () => {
  it("sorts debt first, then unconfigured, then low balance, then the rest", () => {
    const items = [
      makeItem("normal", { available_lesson_count: 6 }),
      makeItem("one-lesson", { available_lesson_count: 1, requires_attention: true, balance_label: "1 урок" }),
      makeItem("unconfigured", { billing_mode: null, billing_not_configured: true, requires_attention: true, balance_label: "Не настроено" }),
      makeItem("debt", { available_lesson_count: 0, debt_lesson_count: 1, billing_is_negative: true, requires_attention: true, debt_label: "1 урок в минусе" })
    ];

    const sorted = [...items].sort(compareAdminPaymentControlItems);

    expect(sorted.map((item) => item.student_id)).toEqual(["debt", "unconfigured", "one-lesson", "normal"]);
  });
});

describe("mapAdminPaymentControlRow", () => {
  it("formats labels from SQL-backed aggregate rows", () => {
    const dto = mapAdminPaymentControlRow({
      student_id: "student-1",
      profile_id: "profile-1",
      first_name: "Иван",
      last_name: "Иванов",
      email: "ivan@example.com",
      phone: null,
      billing_mode: "per_lesson_price",
      available_lesson_count: 2,
      debt_lesson_count: 1,
      debt_money_amount: 1800,
      money_remainder_amount: 600,
      lesson_price_amount: 1800,
      effective_lesson_price_amount: 1800,
      billing_currency: "RUB",
      billing_not_configured: false,
      requires_attention: true,
      billing_is_negative: true
    });

    expect(dto.balance_label).toBe("2 урока");
    expect(dto.debt_label).toContain("1 урок");
    expect(dto.debt_label).toContain("1 800");
    expect(dto.requires_attention).toBe(true);
  });
});
