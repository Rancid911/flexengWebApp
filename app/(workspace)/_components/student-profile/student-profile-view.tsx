import Link from "next/link";
import { ArrowLeft, CalendarClock, TriangleAlert } from "lucide-react";

import { TeacherStudentProfileClient } from "@/app/(workspace)/(teacher-zone)/students/[studentId]/teacher-student-profile-client";
import { Card, CardContent } from "@/components/ui/card";
import { formatScheduleDateLabel, formatScheduleTimeRange, getAttendanceStatusShortLabel } from "@/lib/schedule/utils";
import type { TeacherStudentProfileSections } from "@/lib/teacher-workspace/sections";

export type StudentProfileBackLink = {
  href: string;
  label: string;
};

type Props = {
  sections: TeacherStudentProfileSections;
  canWriteNotes: boolean;
  canManageBilling: boolean;
  canAssignPlacement: boolean;
  canAssignHomework: boolean;
  backLink: StudentProfileBackLink;
  profileBasePath: string;
};

export function StudentProfileView({ sections, canWriteNotes, canManageBilling, canAssignPlacement, canAssignHomework, backLink, profileBasePath }: Props) {
  const upcomingLessons = sections.upcomingLessons.slice(0, 2);
  const recentLessons = sections.recentLessons.slice(0, 2);
  const timelineHomework = sections.recentHomework.filter(
    (item) => item.linkedLessonId != null || item.items.some((homeworkItem) => homeworkItem.assessmentKind === "placement")
  ).slice(0, 2);
  const recentMistakes = sections.recentMistakes.slice(0, 2);

  return (
    <div className="space-y-5 pb-8">
      <section className="rounded-[2rem] border border-[#dfe9fb] bg-[linear-gradient(135deg,#0f172a_0%,#173969_52%,#1f7aff_100%)] p-6 text-white shadow-[0_20px_44px_rgba(15,23,42,0.18)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Link href={backLink.href} className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              {backLink.label}
            </Link>
            <div>
              <h1 className="text-3xl font-black tracking-[-0.05em] sm:text-4xl">{sections.header.studentName}</h1>
              <p className="mt-2 max-w-3xl text-sm text-[#dbeafe] sm:text-base">
                {sections.header.englishLevel ?? "Уровень не указан"}
                {sections.header.targetLevel ? ` → цель ${sections.header.targetLevel}` : ""}
              </p>
            </div>
            {sections.header.learningGoal ? <p className="max-w-3xl text-sm text-white/85">{sections.header.learningGoal}</p> : null}
          </div>
          <div className="rounded-[1.4rem] border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-sm">
            <p className="text-sm text-white/75">Ближайший фокус</p>
            <p className="mt-2 text-lg font-black">{sections.recentMistakes[0]?.moduleTitle ?? "Следить за прогрессом и homework"}</p>
          </div>
        </div>
      </section>

      <TeacherStudentProfileClient
        studentId={sections.header.studentId}
        initialNotes={sections.notes}
        initialPlacementSummary={sections.placementSummary}
        initialStandaloneHomework={sections.standaloneHomework}
        initialBillingSummary={sections.billingSnapshot}
        billingSummaryDeferred={sections.billingSummaryDeferred}
        canWriteNotes={canWriteNotes}
        canManageBilling={canManageBilling}
        canAssignPlacement={canAssignPlacement}
        canAssignHomework={canAssignHomework}
        detailBasePath={profileBasePath}
        lessonsSlot={
          <Card className="rounded-[2rem] border-[#dfe9fb] bg-white shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black tracking-[-0.04em] text-slate-900">Уроки</h2>
                <Link href={`${profileBasePath}/schedule`} className="text-sm font-black text-[#1f7aff] hover:text-[#1669db]">
                  Открыть расписание
                </Link>
              </div>

              <div className="space-y-3">
                {upcomingLessons.length > 0 ? upcomingLessons.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} />) : <EmptyBlock text="Будущих уроков пока нет." />}
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="text-lg font-black tracking-[-0.04em] text-slate-900">Недавние уроки</h3>
                {recentLessons.length > 0 ? recentLessons.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} />) : <EmptyBlock text="История уроков пока пустая." />}
              </div>
            </CardContent>
          </Card>
        }
        homeworkMistakesSlot={
          <Card className="rounded-[2rem] border-[#dfe9fb] bg-white shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-black tracking-[-0.04em] text-slate-900">Homework и ошибки</h2>
                <div className="flex flex-wrap gap-3 text-sm font-black">
                  <Link href={`${profileBasePath}/homework`} className="text-[#1f7aff] hover:text-[#1669db]">
                    Все homework
                  </Link>
                  <Link href={`${profileBasePath}/mistakes`} className="text-[#1f7aff] hover:text-[#1669db]">
                    Все ошибки
                  </Link>
                </div>
              </div>
              <div className="space-y-3">
                {timelineHomework.length > 0 ? (
                  timelineHomework.map((item) => (
                    <div key={item.id} className="rounded-[1.35rem] border border-[#dfe9fb] bg-white px-4 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-black text-slate-900">{item.title}</p>
                        <div className="flex flex-wrap gap-2 text-xs font-semibold">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                            {item.status === "completed" ? "Завершено" : item.status === "overdue" ? "Просрочено" : item.status === "in_progress" ? "В работе" : "Не начато"}
                          </span>
                          <span className="rounded-full bg-[#f3f0ff] px-3 py-1 text-[#6d28d9]">
                            {item.completedRequiredCount} из {item.requiredCount} обязательных
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{item.description ?? "Описание не добавлено."}</p>
                      <p className="mt-2 text-sm text-slate-500">{item.dueAt ? `Дедлайн: ${formatScheduleDateLabel(item.dueAt)}` : "Без дедлайна"}</p>
                      {item.items.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          {item.items.map((homeworkItem) => (
                            <div key={homeworkItem.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[1rem] border border-[#eef2ff] bg-[#fafbff] px-3 py-3">
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900">{homeworkItem.title}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {homeworkItem.assessmentKind === "placement"
                                    ? "Placement test"
                                    : homeworkItem.activityType === "trainer"
                                      ? "Тренажёр"
                                      : homeworkItem.activityType === "test"
                                        ? "Тест"
                                        : homeworkItem.sourceType}
                                  {homeworkItem.required ? " · обязательно" : " · опционально"}
                                </p>
                                {homeworkItem.assessmentKind === "placement" && homeworkItem.placementSummary ? (
                                  <div className="mt-2 space-y-1 text-xs text-slate-500">
                                    <p>
                                      Рекомендация: {homeworkItem.recommendedLevel ?? "—"}
                                      {homeworkItem.recommendedBandLabel ? ` · ${homeworkItem.recommendedBandLabel}` : ""}
                                    </p>
                                    <p>
                                      Секции:{" "}
                                      {homeworkItem.placementSummary.sectionScores
                                        .map((section) => `${section.label} ${section.correctAnswers}/${section.totalQuestions}`)
                                        .join(" · ")}
                                    </p>
                                  </div>
                                ) : null}
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                <span className="rounded-full bg-white px-3 py-1 text-slate-700">
                                  {homeworkItem.status === "completed" ? "Завершено" : homeworkItem.status === "in_progress" ? "В работе" : "Не начато"}
                                </span>
                                {homeworkItem.lastScore != null ? (
                                  <span className="rounded-full bg-[#ede9fe] px-3 py-1 text-[#6d28d9]">{homeworkItem.lastScore}%</span>
                                ) : null}
                                {homeworkItem.assessmentKind === "placement" && homeworkItem.recommendedLevel ? (
                                  <span className="rounded-full bg-white px-3 py-1 text-slate-700">{homeworkItem.recommendedLevel}</span>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <EmptyBlock text="Lesson-linked homework и placement пока нет." />
                )}
              </div>
              <div className="space-y-3 pt-2">
                {recentMistakes.length > 0 ? (
                  recentMistakes.map((item) => (
                    <div key={item.id} className="rounded-[1.35rem] border border-[#dfe9fb] bg-[#fbfdff] px-4 py-4">
                      <p className="font-black text-slate-900">{item.moduleTitle ?? item.testTitle ?? "Ошибка в активности"}</p>
                      <p className="mt-1 text-sm text-slate-600">Повторений ошибки: {item.count}</p>
                    </div>
                  ))
                ) : (
                  <EmptyBlock text="Ошибок для разбора пока нет." />
                )}
              </div>
            </CardContent>
          </Card>
        }
      />
    </div>
  );
}

function LessonCard({ lesson }: { lesson: TeacherStudentProfileSections["upcomingLessons"][number] }) {
  return (
    <div className="rounded-[1.35rem] border border-[#dfe9fb] bg-white px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-slate-900">{lesson.title}</p>
          <p className="mt-1 text-sm text-slate-600">{formatScheduleDateLabel(lesson.startsAt)}</p>
          <p className="mt-1 text-sm text-slate-500">{formatScheduleTimeRange(lesson.startsAt, lesson.endsAt)}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef5ff] text-[#1f7aff]">
          <CalendarClock className="h-4 w-4" />
        </span>
      </div>
      {lesson.attendanceStatus || lesson.hasOutcome ? (
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
          {lesson.attendanceStatus ? <span className="rounded-full bg-slate-100 px-3 py-1">Посещаемость: {getAttendanceStatusShortLabel(lesson.attendanceStatus)}</span> : null}
          {lesson.hasOutcome ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Есть итог</span> : null}
        </div>
      ) : null}
    </div>
  );
}

function EmptyBlock({ text }: { text: string }) {
  return (
    <div className="rounded-[1.35rem] border border-dashed border-[#d7e4f5] bg-[#f8fbff] px-4 py-5 text-sm text-slate-600">
      <div className="flex items-center gap-2">
        <TriangleAlert className="h-4 w-4" />
        {text}
      </div>
    </div>
  );
}
