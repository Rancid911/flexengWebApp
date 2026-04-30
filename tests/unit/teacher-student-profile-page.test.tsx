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

vi.mock("@/lib/schedule/server", () => ({
  requireSchedulePage: () => requireSchedulePageMock(),
  isStudentScheduleActor: (actor: { role: string }) => actor.role === "student",
  isTeacherScheduleActor: (actor: { role: string }) => actor.role === "teacher",
  isStaffAdminScheduleActor: (actor: { role: string }) => actor.role === "manager" || actor.role === "admin"
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

vi.mock("@/app/(workspace)/(teacher-zone)/students/[studentId]/teacher-student-profile-view", () => ({
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
  });

  it("renders teacher profile route for teacher actor", async () => {
    requireSchedulePageMock.mockResolvedValue({ role: "teacher", userId: "user-1" });
    mockSectionLoaders();

    const result = await TeacherStudentProfilePage({
      params: Promise.resolve({ studentId: "student-1" })
    });

    expect(getTeacherStudentHeaderSummaryMock).toHaveBeenCalledWith({ role: "teacher", userId: "user-1" }, "student-1");
    expect(result).toBeTruthy();
  });

  it("keeps billing management out of teacher route", async () => {
    requireSchedulePageMock.mockResolvedValue({ role: "teacher", userId: "user-1" });
    mockSectionLoaders();

    const result = await TeacherStudentProfilePage({
      params: Promise.resolve({ studentId: "student-1" })
    });

    expect(result.props.canWriteNotes).toBe(true);
    expect(result.props.canManageBilling).toBe(false);
    expect(result.props.canAssignHomework).toBe(true);
  });

  it("redirects staff-admin actor to admin student profile route", async () => {
    requireSchedulePageMock.mockResolvedValue({ role: "manager", userId: "user-1" });

    await expect(
      TeacherStudentProfilePage({
        params: Promise.resolve({ studentId: "student-1" })
      })
    ).rejects.toThrow("redirect:/admin/students/student-1");
  });

  it("redirects student actor away from teacher profile page", async () => {
    requireSchedulePageMock.mockResolvedValue({ role: "student", userId: "user-2" });

    await expect(
      TeacherStudentProfilePage({
        params: Promise.resolve({ studentId: "student-1" })
      })
    ).rejects.toThrow("redirect:/dashboard");
  });
});
