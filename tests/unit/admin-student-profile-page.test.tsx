import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminStudentProfilePage from "@/app/(workspace)/(staff-zone)/admin/students/[studentId]/page";

const requireSchedulePageMock = vi.fn();
const loadTeacherStudentProfileSectionsMock = vi.fn();
const redirectMock = vi.fn((href: string) => {
  throw new Error(`redirect:${href}`);
});

vi.mock("next/navigation", () => ({
  redirect: (href: string) => redirectMock(href)
}));

vi.mock("@/lib/schedule/server", () => ({
  requireSchedulePage: () => requireSchedulePageMock(),
  isStudentScheduleActor: (actor: { role: string }) => actor.role === "student",
  isStaffAdminScheduleActor: (actor: { role: string }) => actor.role === "manager" || actor.role === "admin"
}));

vi.mock("@/lib/teacher-workspace/profile-page", () => ({
  loadTeacherStudentProfileSections: (...args: unknown[]) => loadTeacherStudentProfileSectionsMock(...args)
}));

vi.mock("@/app/(workspace)/_components/student-profile/student-profile-view", () => ({
  StudentProfileView: (props: unknown) => <div data-testid="student-profile-probe">{JSON.stringify(props)}</div>
}));

describe("AdminStudentProfilePage", () => {
  beforeEach(() => {
    requireSchedulePageMock.mockReset();
    loadTeacherStudentProfileSectionsMock.mockReset();
    redirectMock.mockClear();
  });

  it("renders student profile in staff mode with admin back link and billing management", async () => {
    const actor = { role: "admin", userId: "admin-1" };
    const sections = { header: { studentId: "student-1", studentName: "Student One" } };
    requireSchedulePageMock.mockResolvedValue(actor);
    loadTeacherStudentProfileSectionsMock.mockResolvedValue(sections);

    const result = await AdminStudentProfilePage({
      params: Promise.resolve({ studentId: "student-1" })
    });

    expect(loadTeacherStudentProfileSectionsMock).toHaveBeenCalledWith(actor, "student-1");
    expect(result.props.canWriteNotes).toBe(true);
    expect(result.props.canManageBilling).toBe(true);
    expect(result.props.canAssignPlacement).toBe(true);
    expect(result.props.canAssignHomework).toBe(true);
    expect(result.props.backLink).toEqual({ href: "/admin/students", label: "Назад к ученикам" });
  });

  it("redirects student actor away from admin student profile", async () => {
    requireSchedulePageMock.mockResolvedValue({ role: "student", userId: "user-1" });

    await expect(
      AdminStudentProfilePage({
        params: Promise.resolve({ studentId: "student-1" })
      })
    ).rejects.toThrow("redirect:/dashboard");
  });

  it("redirects teacher actor away from admin student profile", async () => {
    requireSchedulePageMock.mockResolvedValue({ role: "teacher", userId: "teacher-1" });

    await expect(
      AdminStudentProfilePage({
        params: Promise.resolve({ studentId: "student-1" })
      })
    ).rejects.toThrow("redirect:/dashboard");
  });
});
