import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  renderStudentHomeworkDetailPage,
  renderStudentNotesDetailPage,
  renderStudentScheduleDetailPage
} from "@/features/students/server/student-detail-route";

const requireAdminPagePermissionMock = vi.fn();
const requireSchedulePageMock = vi.fn();
const getTeacherStudentHeaderSummaryMock = vi.fn();
const getTeacherStudentLessonHistoryMock = vi.fn();
const getTeacherStudentHomeworkSnapshotMock = vi.fn();
const getTeacherStudentNotesFeedMock = vi.fn();
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
  isStaffAdminScheduleActor: (actor: { accessMode?: string }) => actor.accessMode === "staff_all",
  isTeacherScheduleActor: (actor: { accessMode?: string }) => actor.accessMode === "teacher_assigned"
}));

vi.mock("@/lib/teacher-workspace/queries", () => ({
  getTeacherStudentHeaderSummary: (...args: unknown[]) => getTeacherStudentHeaderSummaryMock(...args),
  getTeacherStudentLessonHistory: (...args: unknown[]) => getTeacherStudentLessonHistoryMock(...args),
  getTeacherStudentHomeworkSnapshot: (...args: unknown[]) => getTeacherStudentHomeworkSnapshotMock(...args),
  getTeacherStudentMistakesSnapshot: vi.fn(),
  getTeacherStudentNotesFeed: (...args: unknown[]) => getTeacherStudentNotesFeedMock(...args)
}));

function mockHeader() {
  getTeacherStudentHeaderSummaryMock.mockResolvedValue({
    studentId: "student-1",
    studentName: "Student One",
    englishLevel: "A2",
    targetLevel: "B1",
    learningGoal: null
  });
}

describe("student detail route helpers", () => {
  beforeEach(() => {
    requireAdminPagePermissionMock.mockReset();
    requireAdminPagePermissionMock.mockResolvedValue({ userId: "admin-1", role: "admin" });
    requireSchedulePageMock.mockReset();
    getTeacherStudentHeaderSummaryMock.mockReset();
    getTeacherStudentLessonHistoryMock.mockReset();
    getTeacherStudentHomeworkSnapshotMock.mockReset();
    getTeacherStudentNotesFeedMock.mockReset();
    redirectMock.mockClear();
  });

  it("loads full schedule for staff admin route", async () => {
    const actor = { role: "admin", accessMode: "staff_all", userId: "admin-1" };
    requireSchedulePageMock.mockResolvedValue(actor);
    mockHeader();
    getTeacherStudentLessonHistoryMock.mockResolvedValue({ upcomingLessons: [], recentLessons: [] });

    const result = await renderStudentScheduleDetailPage("admin", "student-1");

    expect(result).toBeTruthy();
    expect(requireAdminPagePermissionMock).toHaveBeenCalledWith("students.view");
    expect(getTeacherStudentLessonHistoryMock).toHaveBeenCalledWith(actor, "student-1", { upcomingLimit: 100, recentLimit: 100 });
  });

  it("renders staff admin in-place on teacher mirror route without admin path redirect", async () => {
    const actor = { role: "manager", accessMode: "staff_all", userId: "manager-1" };
    requireSchedulePageMock.mockResolvedValue(actor);
    mockHeader();
    getTeacherStudentHomeworkSnapshotMock.mockResolvedValue([]);

    const result = await renderStudentHomeworkDetailPage("teacher", "student-1");

    expect(requireAdminPagePermissionMock).not.toHaveBeenCalled();
    expect(getTeacherStudentHomeworkSnapshotMock).toHaveBeenCalledWith(actor, "student-1", { limit: 100 });
    expect(result.props.profileHref).toBe("/students/student-1");
    expect(redirectMock).not.toHaveBeenCalledWith("/admin/students/student-1/homework");
  });

  it("renders notes detail with write access for staff admin route", async () => {
    const actor = { role: "manager", accessMode: "staff_all", userId: "manager-1" };
    requireSchedulePageMock.mockResolvedValue(actor);
    mockHeader();
    getTeacherStudentNotesFeedMock.mockResolvedValue([]);

    const result = await renderStudentNotesDetailPage("admin", "student-1");

    expect(requireAdminPagePermissionMock).toHaveBeenCalledWith("students.view");
    expect(getTeacherStudentNotesFeedMock).toHaveBeenCalledWith(actor, "student-1", { limit: 100 });
    expect(result.props.children.props.canWriteNotes).toBe(true);
    expect(result.props.children.props.studentId).toBe("student-1");
  });

  it("redirects student actor away from detail pages", async () => {
    requireSchedulePageMock.mockResolvedValue({ role: "student", accessMode: "student_own", userId: "student-user-1" });

    await expect(renderStudentScheduleDetailPage("admin", "student-1")).rejects.toThrow("redirect:/dashboard");
  });

  it("denies admin detail routes before schedule context and data loading when students.view is missing", async () => {
    requireAdminPagePermissionMock.mockRejectedValue(new Error("redirect:/"));

    await expect(renderStudentScheduleDetailPage("admin", "student-1")).rejects.toThrow("redirect:/");

    expect(requireSchedulePageMock).not.toHaveBeenCalled();
    expect(getTeacherStudentHeaderSummaryMock).not.toHaveBeenCalled();
    expect(getTeacherStudentLessonHistoryMock).not.toHaveBeenCalled();
  });
});
