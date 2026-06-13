import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TeacherStudentsPage from "@/app/(workspace)/(teacher-zone)/students/page";

const requireSchedulePageMock = vi.fn();
const listTeacherStudentsPageMock = vi.fn();
const renderAdminStudentsDirectoryRouteMock = vi.fn();
const redirectMock = vi.fn((href: string) => {
  throw new Error(`NEXT_REDIRECT:${href}`);
});
const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (href: string) => redirectMock(href),
  usePathname: () => "/students",
  useRouter: () => ({
    replace: replaceMock
  })
}));

vi.mock("@/lib/schedule/server", () => ({
  requireSchedulePage: () => requireSchedulePageMock(),
  isStudentScheduleActor: (actor: { accessMode?: string }) => actor.accessMode === "student_own",
  isStaffAdminScheduleActor: (actor: { accessMode?: string }) => actor.accessMode === "staff_all",
  isTeacherScheduleActor: (actor: { accessMode?: string }) => actor.accessMode === "teacher_assigned"
}));

vi.mock("@/lib/auth/rbac-route-guard", () => ({
  requireWorkspaceRouteAccess: vi.fn()
}));

vi.mock("@/lib/teacher-workspace/queries", () => ({
  listTeacherStudentsPage: (...args: unknown[]) => listTeacherStudentsPageMock(...args)
}));

vi.mock("@/features/admin/server/admin-directory-routes", () => ({
  renderAdminStudentsDirectoryRoute: (...args: unknown[]) => renderAdminStudentsDirectoryRouteMock(...args)
}));

vi.mock("@/lib/server/timing", () => ({
  measureServerTiming: async (_label: string, callback: () => Promise<unknown>) => callback()
}));

const teacherActor = {
  role: "teacher",
  accessMode: "teacher_assigned",
  userId: "teacher-user-1",
  teacherId: "teacher-1",
  studentId: null,
  accessibleStudentIds: ["student-1"]
};

describe("TeacherStudentsPage", () => {
  beforeEach(() => {
    cleanup();
    requireSchedulePageMock.mockReset();
    listTeacherStudentsPageMock.mockReset();
    renderAdminStudentsDirectoryRouteMock.mockReset();
    redirectMock.mockClear();
    replaceMock.mockReset();
    requireSchedulePageMock.mockResolvedValue(teacherActor);
    renderAdminStudentsDirectoryRouteMock.mockResolvedValue(<div data-testid="admin-students-in-place" />);
    listTeacherStudentsPageMock.mockResolvedValue({
      items: [
        {
          studentId: "student-1",
          studentName: "Student One",
          email: "student@example.com",
          phone: "+7 999 000-00-00",
          englishLevel: "A2",
          targetLevel: "B1",
          nextLessonAt: null,
          activeHomeworkCount: 2
        }
      ],
      total: 1,
      page: 1,
      pageSize: 5,
      pageCount: 1
    });
  });

  it("renders teacher students directory without billing information", async () => {
    render(await TeacherStudentsPage({ searchParams: Promise.resolve({ q: " Student ", page: "2" }) }));

    expect(listTeacherStudentsPageMock).toHaveBeenCalledWith(teacherActor, { q: "Student", page: 2, pageSize: 5 });
    expect(screen.getByRole("heading", { name: "Карточки учеников" })).toBeInTheDocument();
    expect(screen.getByLabelText("Поиск ученика")).toHaveValue("Student");
    expect(screen.getByRole("link", { name: "Открыть карточку" })).toHaveAttribute("href", "/students/student-1");
    expect(screen.getByText("Активных ДЗ: 2")).toBeInTheDocument();
    expect(screen.queryByText("Доступно уроков")).not.toBeInTheDocument();
    expect(screen.queryByText(/^Долг:/)).not.toBeInTheDocument();
  });

  it("redirects student actor away from teacher students directory", async () => {
    requireSchedulePageMock.mockResolvedValue({ ...teacherActor, role: "student", accessMode: "student_own", teacherId: null, studentId: "student-1" });

    await expect(TeacherStudentsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    expect(listTeacherStudentsPageMock).not.toHaveBeenCalled();
  });

  it("renders staff actor in-place on students directory without admin path redirect", async () => {
    requireSchedulePageMock.mockResolvedValue({ ...teacherActor, role: "admin", accessMode: "staff_all", teacherId: null, accessibleStudentIds: null });

    render(await TeacherStudentsPage({ searchParams: Promise.resolve({ q: "Admin", page: "2" }) }));

    expect(renderAdminStudentsDirectoryRouteMock).toHaveBeenCalledWith({
      searchParams: expect.any(Promise),
      basePath: "/students"
    });
    expect(listTeacherStudentsPageMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalledWith("/admin/students");
    expect(screen.getByTestId("admin-students-in-place")).toBeInTheDocument();
  });
});
