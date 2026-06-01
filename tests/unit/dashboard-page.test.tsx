import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import DashboardPage from "@/app/(workspace)/(shared-zone)/dashboard/page";

const requireLayoutActorMock = vi.fn();
const requireAppActorMock = vi.fn();
const renderStudentDashboardRouteMock = vi.fn();
const resolveScheduleActorMock = vi.fn();
const getTeacherDashboardAttentionQueueMock = vi.fn();
const getTeacherDashboardWeekLessonBundleMock = vi.fn();
const getTeacherDashboardStudentRosterSummaryMock = vi.fn();
const getAdminDashboardMetricsMock = vi.fn();

vi.mock("@/lib/auth/request-context", () => ({
  requireAppActor: () => requireAppActorMock(),
  requireLayoutActor: () => requireLayoutActorMock(),
  resolveDefaultWorkspace: (actor: { isStaffAdmin?: boolean; isTeacher?: boolean; isStudent?: boolean; profileRole?: string | null }) => {
    if (actor.isStaffAdmin) return actor.profileRole === "admin" ? "admin" : "manager";
    if (actor.isTeacher) return "teacher";
    if (actor.isStudent) return "student";
    return actor.profileRole ?? null;
  }
}));

vi.mock("@/features/dashboard/server/student-dashboard-route", () => ({
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

vi.mock("@/lib/admin/dashboard-metrics", () => ({
  getAdminDashboardMetrics: (...args: unknown[]) => getAdminDashboardMetricsMock(...args)
}));

vi.mock("@/features/dashboard/components/admin-dashboard-view", () => ({
  default: ({ initialMetrics }: { initialMetrics?: unknown }) => <div data-testid="admin-dashboard">{JSON.stringify(initialMetrics ?? null)}</div>
}));

vi.mock("@/features/dashboard/components/staff-dashboard-view", () => ({
  default: ({ role }: { role?: string }) => <div data-testid="staff-dashboard">{role}</div>
}));

vi.mock("@/features/dashboard/components/teacher-dashboard-view", () => ({
  default: ({
    data,
    profileLinked = true,
    studentRosterCount,
    studentRosterSlot
  }: {
    data: unknown;
    profileLinked?: boolean;
    studentRosterCount?: number | null;
    studentRosterSlot?: ReactNode;
  }) => (
    <div
      data-testid="teacher-dashboard"
      data-profile-linked={profileLinked ? "true" : "false"}
      data-roster-count={studentRosterCount === null ? "null" : String(studentRosterCount ?? "")}
      data-has-roster-slot={studentRosterSlot ? "true" : "false"}
    >
      {JSON.stringify(data)}
    </div>
  ),
  TeacherDashboardAttentionSection: ({ lessons }: { lessons: unknown[] }) => <div data-testid="teacher-dashboard-attention">{lessons.length}</div>,
  TeacherDashboardRosterSection: ({ students }: { students: unknown[] }) => <div data-testid="teacher-dashboard-roster">{students.length}</div>
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    requireLayoutActorMock.mockReset();
    requireAppActorMock.mockReset();
    renderStudentDashboardRouteMock.mockReset();
    resolveScheduleActorMock.mockReset();
    getTeacherDashboardAttentionQueueMock.mockReset();
    getTeacherDashboardWeekLessonBundleMock.mockReset();
    getTeacherDashboardStudentRosterSummaryMock.mockReset();
    getAdminDashboardMetricsMock.mockReset();
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
    const layoutActor = {
      userId: "user-1",
      profileRole: "student",
      isStudent: true,
      isTeacher: true,
      isStaffAdmin: false
    };
    const fullActor = {
      ...layoutActor,
      accessibleStudentIds: ["student-1"]
    };
    requireLayoutActorMock.mockResolvedValue(layoutActor);
    requireAppActorMock.mockResolvedValue(fullActor);
    resolveScheduleActorMock.mockResolvedValueOnce({
      role: "teacher",
      userId: "user-1",
      teacherId: "teacher-1",
      studentId: "student-1",
      accessibleStudentIds: null
    }).mockResolvedValueOnce({
      role: "teacher",
      userId: "user-1",
      teacherId: "teacher-1",
      studentId: "student-1",
      accessibleStudentIds: ["student-1"]
    });
    getTeacherDashboardWeekLessonBundleMock.mockResolvedValue({ todayLessons: [], weekLessons: [], attentionQueue: [] });
    getTeacherDashboardStudentRosterSummaryMock.mockResolvedValue([{ studentId: "student-1" }]);
    getTeacherDashboardAttentionQueueMock.mockResolvedValue([]);
    const result = await DashboardPage();

    expect(renderStudentDashboardRouteMock).not.toHaveBeenCalled();
    expect(requireAppActorMock).toHaveBeenCalledTimes(1);
    expect(resolveScheduleActorMock).toHaveBeenCalledWith(layoutActor, "contextOnly");
    expect(resolveScheduleActorMock).toHaveBeenCalledWith(fullActor, "teacherScope");
    expect(getTeacherDashboardWeekLessonBundleMock).toHaveBeenCalled();
    expect(getTeacherDashboardStudentRosterSummaryMock).toHaveBeenCalledWith(
      expect.objectContaining({ accessibleStudentIds: ["student-1"] }),
      { weekLessons: [] }
    );
    expect((result as { props: { data: { students: unknown[] }; studentRosterCount: unknown; studentRosterSlot: unknown } }).props.data.students).toEqual([{ studentId: "student-1" }]);
    expect((result as { props: { studentRosterCount: unknown } }).props.studentRosterCount).toBe(1);
    expect((result as { props: { studentRosterSlot: unknown } }).props.studentRosterSlot).toBeUndefined();
    expect(result).toBeTruthy();
  });

  it("loads teacher roster before returning the teacher dashboard", async () => {
    const layoutActor = {
      userId: "teacher-user-1",
      profileRole: "teacher",
      isStudent: false,
      isTeacher: true,
      isStaffAdmin: false
    };
    const fullActor = {
      ...layoutActor,
      accessibleStudentIds: ["student-1", "student-2"]
    };
    requireLayoutActorMock.mockResolvedValue(layoutActor);
    requireAppActorMock.mockResolvedValue(fullActor);
    resolveScheduleActorMock.mockResolvedValueOnce({
      role: "teacher",
      userId: "teacher-user-1",
      teacherId: "teacher-1",
      studentId: null,
      accessibleStudentIds: null
    }).mockResolvedValueOnce({
      role: "teacher",
      userId: "teacher-user-1",
      teacherId: "teacher-1",
      studentId: null,
      accessibleStudentIds: ["student-1", "student-2"]
    });
    getTeacherDashboardWeekLessonBundleMock.mockResolvedValue({ todayLessons: [], weekLessons: [], attentionQueue: [] });
    getTeacherDashboardStudentRosterSummaryMock.mockResolvedValue([{ studentId: "student-1" }, { studentId: "student-2" }]);

    const result = await DashboardPage();

    expect(getTeacherDashboardWeekLessonBundleMock).toHaveBeenCalledTimes(1);
    expect(requireAppActorMock).toHaveBeenCalledTimes(1);
    expect(resolveScheduleActorMock).toHaveBeenCalledWith(layoutActor, "contextOnly");
    expect(resolveScheduleActorMock).toHaveBeenCalledWith(fullActor, "teacherScope");
    expect(getTeacherDashboardStudentRosterSummaryMock).toHaveBeenCalledWith(
      expect.objectContaining({ accessibleStudentIds: ["student-1", "student-2"] }),
      { weekLessons: [] }
    );
    expect((result as { props: { data: { students: unknown[] }; studentRosterCount: unknown; studentRosterSlot: unknown } }).props.data.students).toEqual([
      { studentId: "student-1" },
      { studentId: "student-2" }
    ]);
    expect((result as { props: { studentRosterCount: unknown } }).props.studentRosterCount).toBe(2);
    expect((result as { props: { studentRosterSlot: unknown } }).props.studentRosterSlot).toBeUndefined();
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

  it("passes server-loaded metrics into the admin dashboard", async () => {
    const metrics = {
      revenue_month: 123456,
      new_payments_7d: 7,
      active_students_7d: 12,
      active_teachers_7d: 3,
      avg_check_month: 4567,
      currency: "RUB"
    };
    requireLayoutActorMock.mockResolvedValue({
      userId: "admin-1",
      profileRole: "admin",
      isStudent: false,
      isTeacher: false,
      isStaffAdmin: true
    });
    getAdminDashboardMetricsMock.mockResolvedValue(metrics);

    const result = await DashboardPage();

    expect(getAdminDashboardMetricsMock).toHaveBeenCalledTimes(1);
    expect((result as { props: { initialMetrics: unknown } }).props.initialMetrics).toEqual(metrics);
    expect(result).toBeTruthy();
  });

  it("keeps rendering the admin dashboard when server metrics fail", async () => {
    requireLayoutActorMock.mockResolvedValue({
      userId: "admin-1",
      profileRole: "admin",
      isStudent: false,
      isTeacher: false,
      isStaffAdmin: true
    });
    getAdminDashboardMetricsMock.mockRejectedValue(new Error("Metrics unavailable"));

    const result = await DashboardPage();

    expect(getAdminDashboardMetricsMock).toHaveBeenCalledTimes(1);
    expect((result as { props: { initialMetrics: unknown } }).props.initialMetrics).toBeNull();
    expect(result).toBeTruthy();
  });
});
