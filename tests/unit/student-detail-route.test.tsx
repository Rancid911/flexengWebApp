import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  renderStudentHomeworkDetailPage,
  renderStudentNotesDetailPage,
  renderStudentScheduleDetailPage
} from "@/app/(workspace)/_components/student-profile/student-detail-route";

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

vi.mock("@/lib/schedule/server", () => ({
  requireSchedulePage: () => requireSchedulePageMock(),
  isStudentScheduleActor: (actor: { role: string }) => actor.role === "student",
  isStaffAdminScheduleActor: (actor: { role: string }) => actor.role === "manager" || actor.role === "admin",
  isTeacherScheduleActor: (actor: { role: string }) => actor.role === "teacher"
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
    requireSchedulePageMock.mockReset();
    getTeacherStudentHeaderSummaryMock.mockReset();
    getTeacherStudentLessonHistoryMock.mockReset();
    getTeacherStudentHomeworkSnapshotMock.mockReset();
    getTeacherStudentNotesFeedMock.mockReset();
    redirectMock.mockClear();
  });

  it("loads full schedule for staff admin route", async () => {
    const actor = { role: "admin", userId: "admin-1" };
    requireSchedulePageMock.mockResolvedValue(actor);
    mockHeader();
    getTeacherStudentLessonHistoryMock.mockResolvedValue({ upcomingLessons: [], recentLessons: [] });

    const result = await renderStudentScheduleDetailPage("admin", "student-1");

    expect(result).toBeTruthy();
    expect(getTeacherStudentLessonHistoryMock).toHaveBeenCalledWith(actor, "student-1", { upcomingLimit: 100, recentLimit: 100 });
  });

  it("redirects staff admin from teacher mirror route to admin mirror route", async () => {
    requireSchedulePageMock.mockResolvedValue({ role: "manager", userId: "manager-1" });

    await expect(renderStudentHomeworkDetailPage("teacher", "student-1")).rejects.toThrow("redirect:/admin/students/student-1/homework");
  });

  it("renders notes detail with write access for staff admin route", async () => {
    const actor = { role: "manager", userId: "manager-1" };
    requireSchedulePageMock.mockResolvedValue(actor);
    mockHeader();
    getTeacherStudentNotesFeedMock.mockResolvedValue([]);

    const result = await renderStudentNotesDetailPage("admin", "student-1");

    expect(getTeacherStudentNotesFeedMock).toHaveBeenCalledWith(actor, "student-1", { limit: 100 });
    expect(result.props.children.props.canWriteNotes).toBe(true);
    expect(result.props.children.props.studentId).toBe("student-1");
  });

  it("redirects student actor away from detail pages", async () => {
    requireSchedulePageMock.mockResolvedValue({ role: "student", userId: "student-user-1" });

    await expect(renderStudentScheduleDetailPage("admin", "student-1")).rejects.toThrow("redirect:/dashboard");
  });
});
