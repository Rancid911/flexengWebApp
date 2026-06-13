import { beforeEach, describe, expect, it, vi } from "vitest";

import TeacherStudentProfilePage from "@/app/(workspace)/(teacher-zone)/students/[studentId]/page";

const requireSchedulePageMock = vi.fn();
const getTeacherStudentHeaderSummaryMock = vi.fn();
const getTeacherStudentNotesFeedMock = vi.fn();
const getTeacherStudentLessonHistoryMock = vi.fn();
const getTeacherStudentHomeworkSnapshotMock = vi.fn();
const listTeacherStudentStandaloneHomeworkMock = vi.fn();
const getTeacherStudentPlacementSummaryMock = vi.fn();
const getTeacherStudentMistakesSnapshotMock = vi.fn();
const getTeacherStudentBillingSnapshotMock = vi.fn();
const redirectMock = vi.fn((href: string) => {
  throw new Error(`redirect:${href}`);
});

vi.mock("next/navigation", () => ({
  redirect: (href: string) => redirectMock(href)
}));

vi.mock("@/lib/auth/rbac-route-guard", () => ({
  requireWorkspaceRouteAccess: vi.fn()
}));

vi.mock("@/lib/schedule/server", () => ({
  requireSchedulePage: () => requireSchedulePageMock(),
  isStudentScheduleActor: (actor: { accessMode?: string }) => actor.accessMode === "student_own",
  isTeacherScheduleActor: (actor: { accessMode?: string }) => actor.accessMode === "teacher_assigned",
  isStaffAdminScheduleActor: (actor: { accessMode?: string }) => actor.accessMode === "staff_all"
}));

vi.mock("@/lib/teacher-workspace/sections", () => ({
  composeTeacherStudentProfileData: (args: unknown) => args,
  buildTeacherStudentProfileSections: (data: unknown) => data
}));

vi.mock("@/lib/teacher-workspace/queries", () => ({
  getTeacherStudentHeaderSummary: (...args: unknown[]) => getTeacherStudentHeaderSummaryMock(...args),
  getTeacherStudentNotesFeed: (...args: unknown[]) => getTeacherStudentNotesFeedMock(...args),
  getTeacherStudentLessonHistory: (...args: unknown[]) => getTeacherStudentLessonHistoryMock(...args),
  getTeacherStudentHomeworkSnapshot: (...args: unknown[]) => getTeacherStudentHomeworkSnapshotMock(...args),
  listTeacherStudentStandaloneHomework: (...args: unknown[]) => listTeacherStudentStandaloneHomeworkMock(...args),
  getTeacherStudentPlacementSummary: (...args: unknown[]) => getTeacherStudentPlacementSummaryMock(...args),
  getTeacherStudentMistakesSnapshot: (...args: unknown[]) => getTeacherStudentMistakesSnapshotMock(...args),
  getTeacherStudentBillingSnapshot: (...args: unknown[]) => getTeacherStudentBillingSnapshotMock(...args)
}));

vi.mock("@/features/teacher-workspace/components/teacher-student-profile-view", () => ({
  TeacherStudentProfileView: (props: { sections: unknown; canWriteNotes: boolean; canManageBilling: boolean; canAssignHomework: boolean }) => (
    <div
      data-testid="teacher-student-profile-probe"
      data-can-write-notes={props.canWriteNotes ? "true" : "false"}
      data-can-manage-billing={props.canManageBilling ? "true" : "false"}
      data-can-assign-homework={props.canAssignHomework ? "true" : "false"}
    >
      {JSON.stringify(props.sections)}
    </div>
  )
}));

vi.mock("@/features/students/components/student-profile-view", () => ({
  StudentProfileView: (props: {
    sections: { header: { studentId: string } };
    canWriteNotes: boolean;
    canManageBilling: boolean;
    canAssignHomework: boolean;
    canAssignPlacement: boolean;
    backLink: { href: string; label: string };
    profileBasePath: string;
  }) => (
    <div
      data-testid="student-profile-probe"
      data-can-write-notes={props.canWriteNotes ? "true" : "false"}
      data-can-manage-billing={props.canManageBilling ? "true" : "false"}
      data-can-assign-homework={props.canAssignHomework ? "true" : "false"}
      data-can-assign-placement={props.canAssignPlacement ? "true" : "false"}
      data-back-link={props.backLink.href}
      data-profile-base-path={props.profileBasePath}
    >
      {JSON.stringify(props.sections)}
    </div>
  )
}));

function mockSectionLoaders() {
  getTeacherStudentHeaderSummaryMock.mockResolvedValue({
    studentId: "student-1",
    studentName: "Student One",
    englishLevel: "A2",
    targetLevel: "B1",
    learningGoal: "Goal"
  });
  getTeacherStudentNotesFeedMock.mockResolvedValue([]);
  getTeacherStudentLessonHistoryMock.mockResolvedValue({ upcomingLessons: [], recentLessons: [] });
  getTeacherStudentHomeworkSnapshotMock.mockResolvedValue([]);
  listTeacherStudentStandaloneHomeworkMock.mockResolvedValue({ assignments: [] });
  getTeacherStudentPlacementSummaryMock.mockResolvedValue(null);
  getTeacherStudentMistakesSnapshotMock.mockResolvedValue([]);
  getTeacherStudentBillingSnapshotMock.mockResolvedValue(null);
}

describe("TeacherStudentProfilePage", () => {
  beforeEach(() => {
    requireSchedulePageMock.mockReset();
    getTeacherStudentHeaderSummaryMock.mockReset();
    getTeacherStudentNotesFeedMock.mockReset();
    getTeacherStudentLessonHistoryMock.mockReset();
    getTeacherStudentHomeworkSnapshotMock.mockReset();
    listTeacherStudentStandaloneHomeworkMock.mockReset();
    getTeacherStudentPlacementSummaryMock.mockReset();
    getTeacherStudentMistakesSnapshotMock.mockReset();
    getTeacherStudentBillingSnapshotMock.mockReset();
    redirectMock.mockClear();
  });

  it("renders teacher profile route for teacher actor", async () => {
    requireSchedulePageMock.mockResolvedValue({ role: "teacher", accessMode: "teacher_assigned", userId: "user-1" });
    mockSectionLoaders();

    const result = await TeacherStudentProfilePage({
      params: Promise.resolve({ studentId: "student-1" })
    });

    expect(getTeacherStudentHeaderSummaryMock).toHaveBeenCalledWith({ role: "teacher", accessMode: "teacher_assigned", userId: "user-1" }, "student-1");
    expect(result).toBeTruthy();
  });

  it("keeps billing management out of teacher route", async () => {
    requireSchedulePageMock.mockResolvedValue({ role: "teacher", accessMode: "teacher_assigned", userId: "user-1" });
    mockSectionLoaders();

    const result = await TeacherStudentProfilePage({
      params: Promise.resolve({ studentId: "student-1" })
    });

    expect(result.props.canWriteNotes).toBe(true);
    expect(result.props.canManageBilling).toBe(false);
    expect(result.props.canAssignHomework).toBe(true);
  });

  it("renders staff-admin actor in-place on teacher student profile path", async () => {
    requireSchedulePageMock.mockResolvedValue({ role: "manager", accessMode: "staff_all", userId: "user-1" });
    mockSectionLoaders();

    const result = await TeacherStudentProfilePage({
      params: Promise.resolve({ studentId: "student-1" })
    });

    expect(getTeacherStudentHeaderSummaryMock).toHaveBeenCalledWith({ role: "manager", accessMode: "staff_all", userId: "user-1" }, "student-1");
    expect(result.props.canWriteNotes).toBe(true);
    expect(result.props.canManageBilling).toBe(true);
    expect(result.props.canAssignHomework).toBe(true);
    expect(result.props.canAssignPlacement).toBe(true);
    expect(result.props.backLink).toEqual({ href: "/students", label: "Назад к ученикам" });
    expect(result.props.profileBasePath).toBe("/students/student-1");
    expect(redirectMock).not.toHaveBeenCalledWith("/admin/students/student-1");
  });

  it("redirects student actor away from teacher profile page", async () => {
    requireSchedulePageMock.mockResolvedValue({ role: "student", accessMode: "student_own", userId: "user-2" });

    await expect(
      TeacherStudentProfilePage({
        params: Promise.resolve({ studentId: "student-1" })
      })
    ).rejects.toThrow("redirect:/dashboard");
  });
});
