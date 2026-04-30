import { isTeacherScheduleActor, type ScheduleActor } from "@/lib/schedule/server";
import { composeTeacherStudentProfileData, buildTeacherStudentProfileSections } from "@/lib/teacher-workspace/sections";
import {
  getTeacherStudentBillingSnapshot,
  getTeacherStudentHeaderSummary,
  getTeacherStudentLessonHistory,
  getTeacherStudentMistakesSnapshot,
  getTeacherStudentNotesFeed,
  getTeacherStudentHomeworkSnapshot,
  getTeacherStudentPlacementSummary,
  listTeacherStudentStandaloneHomework
} from "@/lib/teacher-workspace/queries";

export async function loadTeacherStudentProfileSections(actor: ScheduleActor, studentId: string) {
  const [header, notes, lessonHistory, recentHomework, standaloneHomework, placementSummary, recentMistakes, billingSnapshot] = await Promise.all([
    getTeacherStudentHeaderSummary(actor, studentId),
    getTeacherStudentNotesFeed(actor, studentId, { limit: 2 }),
    getTeacherStudentLessonHistory(actor, studentId, { upcomingLimit: 2, recentLimit: 2 }),
    getTeacherStudentHomeworkSnapshot(actor, studentId, { limit: 10 }),
    listTeacherStudentStandaloneHomework(actor, studentId, { sourceLimit: 10, outputLimit: 2 }),
    getTeacherStudentPlacementSummary(actor, studentId),
    getTeacherStudentMistakesSnapshot(actor, studentId, { limit: 2 }),
    getTeacherStudentBillingSnapshot(actor, studentId)
  ]);

  return buildTeacherStudentProfileSections(
    composeTeacherStudentProfileData({
      header,
      notes,
      upcomingLessons: lessonHistory.upcomingLessons,
      recentLessons: lessonHistory.recentLessons,
      recentHomework,
      standaloneHomework: standaloneHomework.assignments,
      placementSummary,
      recentMistakes,
      billingSnapshot,
      billingSummaryDeferred: !isTeacherScheduleActor(actor)
    })
  );
}
