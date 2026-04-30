import { beforeEach, describe, expect, it, vi } from "vitest";

import DashboardPage from "@/app/(workspace)/(shared-zone)/dashboard/page";

const requireLayoutActorMock = vi.fn();
const renderStudentDashboardRouteMock = vi.fn();
const resolveScheduleActorMock = vi.fn();
const getTeacherDashboardAttentionQueueMock = vi.fn();
const getTeacherDashboardWeekLessonBundleMock = vi.fn();
const getTeacherDashboardStudentRosterSummaryMock = vi.fn();

vi.mock("@/lib/auth/request-context", () => ({
  requireLayoutActor: () => requireLayoutActorMock(),
  resolveDefaultWorkspace: (actor: { isStaffAdmin?: boolean; isTeacher?: boolean; isStudent?: boolean; profileRole?: string | null }) => {
    if (actor.isStaffAdmin) return actor.profileRole === "admin" ? "admin" : "manager";
    if (actor.isTeacher) return "teacher";
    if (actor.isStudent) return "student";
    return actor.profileRole ?? null;
  }
}));

vi.mock("@/app/(workspace)/_components/student-dashboard-route", () => ({
  renderStudentDashboardRoute: (...args: unknown[]) => renderStudentDashboardRouteMock(...args)
}));

vi.mock("@/lib/schedule/server", () => ({
  resolveScheduleActor: (...args: unknown[]) => resolveScheduleActorMock(...args)
}));

vi.mock("@/lib/teacher-workspace/sections", () => ({
  composeTeacherDashboardData: (args: unknown) => args
}));

vi.mock("@/lib/teacher-workspace/queries", () => ({
  getTeacherDashboardAttentionQueue: (...args: unknown[]) => getTeacherDashboardAttentionQueueMock(...args),
  getTeacherDashboardWeekLessonBundle: (...args: unknown[]) => getTeacherDashboardWeekLessonBundleMock(...args),
  getTeacherDashboardStudentRosterSummary: (...args: unknown[]) => getTeacherDashboardStudentRosterSummaryMock(...args)
}));

vi.mock("@/app/(workspace)/(shared-zone)/dashboard/admin-dashboard-view", () => ({
  default: () => <div data-testid="admin-dashboard" />
}));

vi.mock("@/app/(workspace)/(shared-zone)/dashboard/staff-dashboard-view", () => ({
  default: ({ role }: { role?: string }) => <div data-testid="staff-dashboard">{role}</div>
}));

vi.mock("@/app/(workspace)/(shared-zone)/dashboard/teacher-dashboard-view", () => ({
  default: ({ data, profileLinked = true }: { data: unknown; profileLinked?: boolean }) => (
    <div data-testid="teacher-dashboard" data-profile-linked={profileLinked ? "true" : "false"}>
      {JSON.stringify(data)}
    </div>
  ),
  TeacherDashboardAttentionSection: ({ lessons }: { lessons: unknown[] }) => <div data-testid="teacher-dashboard-attention">{lessons.length}</div>,
  TeacherDashboardRosterSection: ({ students }: { students: unknown[] }) => <div data-testid="teacher-dashboard-roster">{students.length}</div>
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    requireLayoutActorMock.mockReset();
    renderStudentDashboardRouteMock.mockReset();
    resolveScheduleActorMock.mockReset();
    getTeacherDashboardAttentionQueueMock.mockReset();
    getTeacherDashboardWeekLessonBundleMock.mockReset();
    getTeacherDashboardStudentRosterSummaryMock.mockReset();
  });

  it("uses the shared student dashboard assembly for the student workspace branch", async () => {
    requireLayoutActorMock.mockResolvedValue({
      userId: "user-student",
      profileRole: "student",
      isStudent: true,
      isTeacher: false,
      isStaffAdmin: false
    });
    renderStudentDashboardRouteMock.mockResolvedValue(<div data-testid="student-dashboard-route" />);

    const result = await DashboardPage();

    expect(renderStudentDashboardRouteMock).toHaveBeenCalledTimes(1);
    expect(result).toBeTruthy();
  });

  it("prefers teacher workspace for dual-role teacher+student actor", async () => {
    const actor = {
      userId: "user-1",
      profileRole: "student",
      isStudent: true,
      isTeacher: true,
      isStaffAdmin: false
    };
    requireLayoutActorMock.mockResolvedValue(actor);
    resolveScheduleActorMock
      .mockResolvedValueOnce({ role: "teacher", userId: "user-1", teacherId: "teacher-1", studentId: "student-1", accessibleStudentIds: null })
      .mockResolvedValueOnce({ role: "teacher", userId: "user-1", teacherId: "teacher-1", studentId: "student-1", accessibleStudentIds: ["student-1"] });
    getTeacherDashboardWeekLessonBundleMock.mockResolvedValue({ todayLessons: [], weekLessons: [], attentionQueue: [] });
    getTeacherDashboardStudentRosterSummaryMock.mockResolvedValue([{ studentId: "student-1", studentName: "Анна", englishLevel: "A2", targetLevel: "B1", nextLessonAt: null, activeHomeworkCount: 0 }]);
    getTeacherDashboardAttentionQueueMock.mockResolvedValue([]);
    const result = await DashboardPage();

    expect(renderStudentDashboardRouteMock).not.toHaveBeenCalled();
    expect(resolveScheduleActorMock).toHaveBeenCalledWith(actor, "contextOnly");
    expect(resolveScheduleActorMock).toHaveBeenCalledWith(actor, "teacherScope");
    expect(getTeacherDashboardWeekLessonBundleMock).toHaveBeenCalled();
    expect(getTeacherDashboardStudentRosterSummaryMock).toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it("renders staff dashboard for manager actor", async () => {
    requireLayoutActorMock.mockResolvedValue({
      userId: "user-2",
      profileRole: "manager",
      isStudent: false,
      isTeacher: false,
      isStaffAdmin: true
    });

    const result = await DashboardPage();
    expect(result).toBeTruthy();
  });
});
