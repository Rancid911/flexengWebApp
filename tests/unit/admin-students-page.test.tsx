import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminStudentsPage from "@/app/(workspace)/(staff-zone)/admin/students/page";

const requireStaffAdminPageMock = vi.fn();
const createAdminClientMock = vi.fn();
const hydrateUsersWithStudentDetailsMock = vi.fn();
const toUserDtoMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("@/lib/admin/auth", () => ({
  requireStaffAdminPage: () => requireStaffAdminPageMock()
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClientMock()
}));

vi.mock("@/lib/admin/users", () => ({
  hydrateUsersWithStudentDetails: (...args: unknown[]) => hydrateUsersWithStudentDetailsMock(...args),
  toUserDto: (...args: unknown[]) => toUserDtoMock(...args)
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/students",
  useRouter: () => ({
    replace: replaceMock
  })
}));

function createProfilesQueryMock(rows: Record<string, unknown>[] = [
  {
    id: "profile-1",
    role: "student",
    first_name: "Student",
    last_name: "One",
    email: "student@example.com",
    phone: "+79990000000",
    created_at: "2026-01-01T00:00:00.000Z"
  }
], count = 12) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    or: vi.fn(),
    order: vi.fn(),
    range: vi.fn()
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.or.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.range.mockResolvedValue({
    data: rows,
    error: null,
    count
  });

  return query;
}

const studentDto = {
  id: "profile-1",
  student_id: "student-1",
  assigned_teacher_id: "teacher-1",
  assigned_teacher_name: "Teacher One",
  role: "student" as const,
  first_name: "Student",
  last_name: "One",
  email: "student@example.com",
  phone: "+7 999 000-00-00",
  birth_date: "2010-01-01",
  english_level: "A2",
  target_level: "B1",
  learning_goal: null,
  notes: null,
  billing_mode: "package_lessons" as const,
  lesson_price_amount: null,
  billing_currency: "RUB",
  billing_balance_label: "4 урока",
  billing_debt_label: null,
  billing_is_negative: false,
  created_at: "2026-01-01T00:00:00.000Z"
};

describe("AdminStudentsPage", () => {
  beforeEach(() => {
    cleanup();
    requireStaffAdminPageMock.mockReset();
    createAdminClientMock.mockReset();
    hydrateUsersWithStudentDetailsMock.mockReset();
    toUserDtoMock.mockReset();
    replaceMock.mockReset();
    requireStaffAdminPageMock.mockResolvedValue({ userId: "admin-1", role: "admin" });
    hydrateUsersWithStudentDetailsMock.mockImplementation(async (_supabase, rows) => rows);
    toUserDtoMock.mockReturnValue(studentDto);
  });

  it("renders search input and loads students without query filter by default", async () => {
    const query = createProfilesQueryMock();
    createAdminClientMock.mockReturnValue({ from: vi.fn(() => query) });

    render(await AdminStudentsPage({ searchParams: Promise.resolve({}) }));

    expect(query.eq).toHaveBeenCalledWith("role", "student");
    expect(query.select).toHaveBeenCalledWith("id, role, first_name, last_name, email, phone, created_at", { count: "exact" });
    expect(query.range).toHaveBeenCalledWith(0, 4);
    expect(query.or).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Карточки учеников" })).toBeInTheDocument();
    expect(screen.getByLabelText("Поиск ученика")).toHaveValue("");
    expect(screen.getByRole("link", { name: "Открыть карточку" })).toHaveAttribute("href", "/admin/students/student-1");
    expect(screen.getByText("Доступно уроков")).toBeInTheDocument();
    expect(screen.getByText("Показано 1 из 12")).toBeInTheDocument();
    expect(screen.getByText("Страница 1 / 3")).toBeInTheDocument();
  });

  it("does not apply q search param below three characters", async () => {
    const query = createProfilesQueryMock();
    createAdminClientMock.mockReturnValue({ from: vi.fn(() => query) });

    render(await AdminStudentsPage({ searchParams: Promise.resolve({ q: " St " }) }));

    expect(query.or).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Поиск ученика")).toHaveValue("St");
  });

  it("uses page search param for server range", async () => {
    const query = createProfilesQueryMock();
    createAdminClientMock.mockReturnValue({ from: vi.fn(() => query) });

    render(await AdminStudentsPage({ searchParams: Promise.resolve({ page: "2" }) }));

    expect(query.range).toHaveBeenCalledWith(5, 9);
    expect(screen.getByText("Страница 2 / 3")).toBeInTheDocument();
  });

  it("applies q search param with at least three characters", async () => {
    const query = createProfilesQueryMock();
    createAdminClientMock.mockReturnValue({ from: vi.fn(() => query) });

    render(await AdminStudentsPage({ searchParams: Promise.resolve({ q: " Student " }) }));

    expect(query.or).toHaveBeenCalledWith("first_name.ilike.%Student%,last_name.ilike.%Student%,email.ilike.%Student%,phone.ilike.%Student%");
    expect(screen.getByLabelText("Поиск ученика")).toHaveValue("Student");

    fireEvent.click(screen.getByRole("button", { name: "Вправо" }));

    expect(replaceMock).toHaveBeenCalledWith("/admin/students?q=Student&page=2", { scroll: false });
  });

  it("renders active search empty state inside students workspace", async () => {
    const query = createProfilesQueryMock([], 0);
    createAdminClientMock.mockReturnValue({ from: vi.fn(() => query) });
    hydrateUsersWithStudentDetailsMock.mockResolvedValue([]);

    render(await AdminStudentsPage({ searchParams: Promise.resolve({ q: "Nobody" }) }));

    expect(screen.getByRole("heading", { name: "Список учеников" })).toBeInTheDocument();
    expect(screen.getByText("По запросу ничего не найдено.")).toBeInTheDocument();
    expect(screen.getByText("Показано 0 из 0")).toBeInTheDocument();
  });
});
