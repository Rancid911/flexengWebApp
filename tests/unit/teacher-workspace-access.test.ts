import { describe, expect, it } from "vitest";

import {
  assertTeacherStudentNotesWriteAccess,
  assertTeacherWorkspaceWriteAccess,
  canManageTeacherStudentBilling,
  canReadTeacherWorkspace,
  canWriteTeacherWorkspaceNotes
} from "@/lib/teacher-workspace/access";
import {
  buildTeacherDashboardCriticalSections,
  buildTeacherDashboardSecondarySections,
  buildTeacherStudentProfileSections,
  composeTeacherDashboardData,
  composeTeacherStudentProfileData
} from "@/lib/teacher-workspace/sections";
import { createScheduleActor } from "@/tests/unit/helpers/actors";

describe("teacher workspace access", () => {
  it("allows teacher-scoped writes only for teacher actors", () => {
    expect(() =>
      assertTeacherWorkspaceWriteAccess(createScheduleActor({
        role: "teacher",
        userId: "user-1",
        studentId: null,
        teacherId: "teacher-1",
        accessibleStudentIds: ["student-1"]
      }))
    ).not.toThrow();

    expect(() =>
      assertTeacherWorkspaceWriteAccess(createScheduleActor({
        role: "manager",
        userId: "user-2",
        studentId: null,
        teacherId: null,
        accessibleStudentIds: null
      }))
    ).toThrow("Teacher write capability required");
  });

  it("keeps staff observer semantics explicit in access helpers", () => {
    expect(canReadTeacherWorkspace(createScheduleActor({ role: "manager", userId: "user-1", studentId: null, teacherId: null, accessibleStudentIds: null }))).toBe(true);
    expect(
      canWriteTeacherWorkspaceNotes(createScheduleActor({
        role: "teacher",
        userId: "user-1",
        studentId: null,
        teacherId: "teacher-1",
        accessibleStudentIds: ["student-1"]
      }), "student-1")
    ).toBe(true);
    expect(
      canWriteTeacherWorkspaceNotes(createScheduleActor({
        role: "manager",
        userId: "user-2",
        studentId: null,
        teacherId: null,
        accessibleStudentIds: null
      }), "student-1")
    ).toBe(true);
    expect(canManageTeacherStudentBilling(createScheduleActor({ role: "admin", userId: "user-3", studentId: null, teacherId: null, accessibleStudentIds: null }))).toBe(true);
  });

  it("allows teacher student note writes for teacher and staff actors only", () => {
    expect(() =>
      assertTeacherStudentNotesWriteAccess(createScheduleActor({
        role: "teacher",
        userId: "teacher-user-1",
        studentId: null,
        teacherId: "teacher-1",
        accessibleStudentIds: ["student-1"]
      }))
    ).not.toThrow();
    expect(() =>
      assertTeacherStudentNotesWriteAccess(createScheduleActor({
        role: "admin",
        userId: "admin-user-1",
        studentId: null,
        teacherId: null,
        accessibleStudentIds: null
      }))
    ).not.toThrow();
    expect(() =>
      assertTeacherStudentNotesWriteAccess(createScheduleActor({
        role: "manager",
        userId: "manager-user-1",
        studentId: null,
        teacherId: null,
        accessibleStudentIds: null
      }))
    ).not.toThrow();
    expect(() =>
      assertTeacherStudentNotesWriteAccess(createScheduleActor({
        role: "student",
        userId: "student-user-1",
        studentId: "student-1",
        teacherId: null,
        accessibleStudentIds: null
      }))
    ).toThrow("Teacher write capability required");
  });
});

describe("teacher workspace sections", () => {
  it("splits dashboard data into critical and secondary sections", () => {
    const data = {
      todayLessons: [
        {
          id: "lesson-1",
          studentId: "student-1",
          studentName: "Анна",
          teacherId: "teacher-1",
          teacherName: "Мария",
          title: "Lesson",
          startsAt: "2026-04-07T10:00:00.000Z",
          endsAt: "2026-04-07T10:45:00.000Z",
          meetingUrl: null,
          comment: null,
          status: "completed" as const,
          createdAt: null,
          updatedAt: null,
          attendanceStatus: null,
          hasOutcome: false,
          studentVisibleOutcome: null
        }
      ],
      weekLessons: [],
      students: [
        {
          studentId: "student-1",
          studentName: "Анна",
          email: "anna@example.com",
          phone: null,
          englishLevel: "A2",
          targetLevel: "B1",
          nextLessonAt: null,
          activeHomeworkCount: 1
        }
      ]
    };

    expect(buildTeacherDashboardCriticalSections(data).weekAttentionQueue).toHaveLength(1);
    expect(buildTeacherDashboardSecondarySections(data).studentRosterSummary).toHaveLength(1);
  });

  it("splits teacher student profile into section-safe slices", () => {
    const sections = buildTeacherStudentProfileSections({
      studentId: "student-1",
      studentName: "Анна",
      englishLevel: "A2",
      targetLevel: "B1",
      learningGoal: "Interview",
      notes: [],
      recentLessons: [],
      upcomingLessons: [],
      recentHomework: [],
      standaloneHomework: [],
      placementSummary: null,
      recentMistakes: [],
      billingSummary: null,
      billingSummaryDeferred: true
    });

    expect(sections.header.studentName).toBe("Анна");
    expect(sections.billingSummaryDeferred).toBe(true);
    expect(sections.notes).toEqual([]);
  });

  it("keeps transitional wrappers adapter-compatible with section assembly", () => {
    const dashboardData = composeTeacherDashboardData({
      todayLessons: [],
      weekLessons: [],
      students: []
    });
    const profileData = composeTeacherStudentProfileData({
      header: {
        studentId: "student-1",
        studentName: "Анна",
        englishLevel: "A2",
        targetLevel: "B1",
        learningGoal: "Interview"
      },
      notes: [],
      upcomingLessons: [],
      recentLessons: [],
      recentHomework: [],
      standaloneHomework: [],
      placementSummary: null,
      recentMistakes: [],
      billingSnapshot: null,
      billingSummaryDeferred: false
    });

    expect(dashboardData.students).toEqual([]);
    expect(profileData.studentId).toBe("student-1");
    expect(profileData.billingSummaryDeferred).toBe(false);
  });
});
