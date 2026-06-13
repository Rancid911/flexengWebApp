import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminStudentProfilePage from "@/app/(workspace)/(staff-zone)/admin/students/[studentId]/page";

const requireAdminPagePermissionMock = vi.fn();
const requireSchedulePageMock = vi.fn();
const loadTeacherStudentProfileSectionsMock = vi.fn();
const redirectMock = vi.fn((href: string) => {
  throw new Error(`redirect:${href}`);
});

vi.mock("next/navigation", () => ({
  redirect: (href: string) => redirectMock(href)
}));

vi.mock("@/lib/admin/auth", () => ({
  requireAdminPagePermission: (permission: string) => requireAdminPagePermissionMock(permission)
}));

vi.mock("@/lib/schedule/server", () => ({
  requireSchedulePage: () => requireSchedulePageMock(),
  isStudentScheduleActor: (actor: { accessMode?: string }) => actor.accessMode === "student_own",
  isStaffAdminScheduleActor: (actor: { accessMode?: string }) => actor.accessMode === "staff_all"
}));

vi.mock("@/lib/teacher-workspace/profile-page", () => ({
  loadTeacherStudentProfileSections: (...args: unknown[]) => loadTeacherStudentProfileSectionsMock(...args)
}));

vi.mock("@/features/students/components/student-profile-view", () => ({
  StudentProfileView: (props: unknown) => <div data-testid="student-profile-probe">{JSON.stringify(props)}</div>
}));

describe("AdminStudentProfilePage", () => {
  beforeEach(() => {
    requireAdminPagePermissionMock.mockReset();
    requireAdminPagePermissionMock.mockResolvedValue({ userId: "admin-1", role: "admin" });
    requireSchedulePageMock.mockReset();
    loadTeacherStudentProfileSectionsMock.mockReset();
    redirectMock.mockClear();
  });

  it("renders student profile in staff mode with admin back link and billing management", async () => {
    const actor = { role: "admin", accessMode: "staff_all", userId: "admin-1" };
    const sections = { header: { studentId: "student-1", studentName: "Student One" } };
    requireSchedulePageMock.mockResolvedValue(actor);
    loadTeacherStudentProfileSectionsMock.mockResolvedValue(sections);

    const result = await AdminStudentProfilePage({
      params: Promise.resolve({ studentId: "student-1" })
    });

    expect(loadTeacherStudentProfileSectionsMock).toHaveBeenCalledWith(actor, "student-1");
    expect(requireAdminPagePermissionMock).toHaveBeenCalledWith("students.view");
    expect(result.props.canWriteNotes).toBe(true);
    expect(result.props.canManageBilling).toBe(true);
    expect(result.props.canAssignPlacement).toBe(true);
    expect(result.props.canAssignHomework).toBe(true);
    expect(result.props.backLink).toEqual({ href: "/admin/students", label: "Назад к ученикам" });
  });

  it("redirects student actor away from admin student profile", async () => {
    requireSchedulePageMock.mockResolvedValue({ role: "student", accessMode: "student_own", userId: "user-1" });

    await expect(
      AdminStudentProfilePage({
        params: Promise.resolve({ studentId: "student-1" })
      })
    ).rejects.toThrow("redirect:/dashboard");
  });

  it("redirects teacher actor away from admin student profile", async () => {
    requireSchedulePageMock.mockResolvedValue({ role: "teacher", accessMode: "teacher_assigned", userId: "teacher-1" });

    await expect(
      AdminStudentProfilePage({
        params: Promise.resolve({ studentId: "student-1" })
      })
    ).rejects.toThrow("redirect:/dashboard");
  });

  it("denies before schedule context and profile loading when students.view is missing", async () => {
    requireAdminPagePermissionMock.mockRejectedValue(new Error("redirect:/"));

    await expect(
      AdminStudentProfilePage({
        params: Promise.resolve({ studentId: "student-1" })
      })
    ).rejects.toThrow("redirect:/");

    expect(requireSchedulePageMock).not.toHaveBeenCalled();
    expect(loadTeacherStudentProfileSectionsMock).not.toHaveBeenCalled();
  });
});
