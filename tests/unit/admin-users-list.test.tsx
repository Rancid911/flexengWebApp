import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminUsersList } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console-lists";
import type { AdminUserDto } from "@/lib/admin/types";

const studentUser: AdminUserDto = {
  id: "profile-1",
  student_id: "student-1",
  assigned_teacher_id: "teacher-1",
  assigned_teacher_name: "Teacher One",
  role: "student",
  first_name: "Student",
  last_name: "One",
  email: "student@example.com",
  phone: "+7 999 000-00-00",
  birth_date: "2010-01-01",
  english_level: "A2",
  target_level: "B1",
  learning_goal: "Speak better",
  notes: null,
  billing_mode: "package_lessons",
  lesson_price_amount: null,
  billing_currency: "RUB",
  billing_balance_label: "4 урока",
  billing_debt_label: null,
  billing_is_negative: false,
  created_at: "2026-01-01T00:00:00.000Z"
};

describe("AdminUsersList", () => {
  it("keeps billing summary but does not render the payment details shortcut", () => {
    render(
      <AdminUsersList
        items={[studentUser]}
        loading={false}
        emptyTitle="Нет пользователей"
        emptyDescription="Пользователи не найдены"
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText("Оплата и списания: пакет уроков")).toBeInTheDocument();
    expect(screen.getByText("Доступно уроков: 4 урока")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Оплата и списания" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Изменить" })).toBeInTheDocument();
  });
});
