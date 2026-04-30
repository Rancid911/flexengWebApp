import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TeacherStudentsPage from "@/app/(workspace)/(teacher-zone)/students/page";

const requireSchedulePageMock = vi.fn();
const listTeacherStudentsPageMock = vi.fn();
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
  isStudentScheduleActor: (actor: { role: string }) => actor.role === "student",
  isStaffAdminScheduleActor: (actor: { role: string }) => actor.role === "admin" || actor.role === "manager",
  isTeacherScheduleActor: (actor: { role: string }) => actor.role === "teacher"
}));

vi.mock("@/lib/teacher-workspace/queries", () => ({
  listTeacherStudentsPage: (...args: unknown[]) => listTeacherStudentsPageMock(...args)
}));

vi.mock("@/lib/server/timing", () => ({
  measureServerTiming: async (_label: string, callback: () => Promise<unknown>) => callback()
}));

const teacherActor = {
  role: "teacher",
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
    redirectMock.mockClear();
    replaceMock.mockReset();
    requireSchedulePageMock.mockResolvedValue(teacherActor);
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
    requireSchedulePageMock.mockResolvedValue({ ...teacherActor, role: "student", teacherId: null, studentId: "student-1" });

    await expect(TeacherStudentsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    expect(listTeacherStudentsPageMock).not.toHaveBeenCalled();
  });

  it("redirects staff actor to admin students directory", async () => {
    requireSchedulePageMock.mockResolvedValue({ ...teacherActor, role: "admin", teacherId: null, accessibleStudentIds: null });

    await expect(TeacherStudentsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("NEXT_REDIRECT:/admin/students");
    expect(listTeacherStudentsPageMock).not.toHaveBeenCalled();
  });
});
