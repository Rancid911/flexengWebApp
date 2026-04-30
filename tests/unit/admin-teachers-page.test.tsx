import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminTeachersPage from "@/app/(workspace)/(staff-zone)/admin/teachers/page";

const requireStaffAdminPageMock = vi.fn();
const createAdminClientMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("@/lib/admin/auth", () => ({
  requireStaffAdminPage: () => requireStaffAdminPageMock()
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClientMock()
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/teachers",
  useRouter: () => ({
    replace: replaceMock
  })
}));

function createProfilesQueryMock(rows: Record<string, unknown>[] = [
  {
    id: "profile-1",
    first_name: "Мария",
    last_name: "Петрова",
    display_name: "Мария Петрова",
    email: "teacher@example.com",
    phone: "+79990000000",
    created_at: "2026-01-01T00:00:00.000Z"
  }
], count = 8) {
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

function createTeachersQueryMock(rows: Record<string, unknown>[] = [{ id: "teacher-1", profile_id: "profile-1" }]) {
  const query = {
    select: vi.fn(),
    in: vi.fn()
  };

  query.select.mockReturnValue(query);
  query.in.mockResolvedValue({
    data: rows,
    error: null
  });

  return query;
}

describe("AdminTeachersPage", () => {
  beforeEach(() => {
    cleanup();
    requireStaffAdminPageMock.mockReset();
    createAdminClientMock.mockReset();
    replaceMock.mockReset();
    requireStaffAdminPageMock.mockResolvedValue({ userId: "admin-1", role: "admin" });
  });

  it("renders teacher cards and loads teachers without query filter by default", async () => {
    const profilesQuery = createProfilesQueryMock();
    const teachersQuery = createTeachersQueryMock();
    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "profiles") return profilesQuery;
        if (table === "teachers") return teachersQuery;
        throw new Error(`Unexpected table: ${table}`);
      })
    });

    render(await AdminTeachersPage({ searchParams: Promise.resolve({}) }));

    expect(profilesQuery.eq).toHaveBeenCalledWith("role", "teacher");
    expect(profilesQuery.select).toHaveBeenCalledWith("id, first_name, last_name, display_name, email, phone, created_at", { count: "exact" });
    expect(profilesQuery.range).toHaveBeenCalledWith(0, 4);
    expect(profilesQuery.or).not.toHaveBeenCalled();
    expect(teachersQuery.in).toHaveBeenCalledWith("profile_id", ["profile-1"]);
    expect(screen.getByRole("heading", { name: "Карточки учителей" })).toBeInTheDocument();
    expect(screen.getByLabelText("Поиск учителя")).toHaveValue("");
    expect(screen.getByText("Мария Петрова")).toBeInTheDocument();
    expect(screen.queryByText("Профиль")).not.toBeInTheDocument();
    expect(screen.queryByText("Базовая карточка")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Открыть карточку" })).toHaveAttribute("href", "/admin/teachers/teacher-1");
    expect(screen.getByText("Показано 1 из 8")).toBeInTheDocument();
    expect(screen.getByText("Страница 1 / 2")).toBeInTheDocument();
  });

  it("does not apply q search param below three characters", async () => {
    const profilesQuery = createProfilesQueryMock();
    const teachersQuery = createTeachersQueryMock();
    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => (table === "profiles" ? profilesQuery : teachersQuery))
    });

    render(await AdminTeachersPage({ searchParams: Promise.resolve({ q: " Ма " }) }));

    expect(profilesQuery.or).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Поиск учителя")).toHaveValue("Ма");
  });

  it("applies q search param from three characters and keeps pagination range", async () => {
    const profilesQuery = createProfilesQueryMock();
    const teachersQuery = createTeachersQueryMock();
    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => (table === "profiles" ? profilesQuery : teachersQuery))
    });

    render(await AdminTeachersPage({ searchParams: Promise.resolve({ q: "Мария", page: "2" }) }));

    expect(profilesQuery.or).toHaveBeenCalledWith("first_name.ilike.%Мария%,last_name.ilike.%Мария%,email.ilike.%Мария%,phone.ilike.%Мария%");
    expect(profilesQuery.range).toHaveBeenCalledWith(5, 9);
  });
});
