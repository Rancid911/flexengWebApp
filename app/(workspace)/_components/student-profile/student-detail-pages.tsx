import Link from "next/link";
import * as React from "react";
import { ArrowLeft, CalendarClock, TriangleAlert } from "lucide-react";

import { StudentNotesPanel } from "@/app/(workspace)/_components/student-profile/student-notes-panel";
import { Card, CardContent } from "@/components/ui/card";
import { formatRuLongDateTime } from "@/lib/dates/format-ru-date";
import { formatScheduleDateLabel, formatScheduleTimeRange, getAttendanceStatusShortLabel } from "@/lib/schedule/utils";
import type { StaffScheduleLessonDto } from "@/lib/schedule/types";
import type {
  TeacherStudentHomeworkDto,
  TeacherStudentMistakeDto,
  TeacherStudentNoteDto,
  TeacherStudentProfileHeaderSummary
} from "@/lib/teacher-workspace/types";

type DetailShellProps = {
  header: TeacherStudentProfileHeaderSummary;
  title: string;
  description: string;
  profileHref: string;
  children: React.ReactNode;
};

export function StudentDetailShell({ header, title, description, profileHref, children }: DetailShellProps) {
  return (
    <div className="space-y-5 pb-8">
      <section className="rounded-[2rem] border border-[#dfe9fb] bg-white p-6 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
        <Link href={profileHref} className="inline-flex items-center gap-2 text-sm font-black text-[#1f7aff] hover:text-[#1669db]">
          <ArrowLeft className="h-4 w-4" />
          Назад к карточке
        </Link>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-[#587198]">{header.studentName}</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">{description}</p>
      </section>
      {children}
    </div>
  );
}

export function StudentScheduleDetail({ upcomingLessons, recentLessons }: { upcomingLessons: StaffScheduleLessonDto[]; recentLessons: StaffScheduleLessonDto[] }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <DetailListCard title="Будущие уроки" emptyText="Будущих уроков пока нет.">
        {upcomingLessons.map((lesson) => <LessonRow key={lesson.id} lesson={lesson} />)}
      </DetailListCard>
      <DetailListCard title="Прошлые уроки" emptyText="История уроков пока пустая.">
        {recentLessons.map((lesson) => <LessonRow key={lesson.id} lesson={lesson} />)}
      </DetailListCard>
    </div>
  );
}

export function StudentHomeworkDetail({ assignments }: { assignments: TeacherStudentHomeworkDto[] }) {
  return (
    <DetailListCard title="Домашние задания" emptyText="Домашние задания пока не назначались.">
      {assignments.map((assignment) => <HomeworkRow key={assignment.id} assignment={assignment} />)}
    </DetailListCard>
  );
}

export function StudentNotesDetail({ studentId, notes, canWriteNotes }: { studentId: string; notes: TeacherStudentNoteDto[]; canWriteNotes: boolean }) {
  return (
    <StudentNotesPanel studentId={studentId} initialNotes={notes} canWriteNotes={canWriteNotes} mode="full" />
  );
}

export function StudentMistakesDetail({ mistakes }: { mistakes: TeacherStudentMistakeDto[] }) {
  return (
    <DetailListCard title="Ошибки" emptyText="Ошибок для разбора пока нет.">
      {mistakes.map((item) => (
        <div key={item.id} className="rounded-[1.35rem] border border-[#dfe9fb] bg-[#fbfdff] px-4 py-4">
          <p className="font-black text-slate-900">{item.moduleTitle ?? item.testTitle ?? "Ошибка в активности"}</p>
          <p className="mt-1 text-sm text-slate-600">Повторений ошибки: {item.count}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">{formatRuLongDateTime(item.lastMistakeAt) || "Без даты"}</p>
        </div>
      ))}
    </DetailListCard>
  );
}

function DetailListCard({ title, emptyText, children }: { title: string; emptyText: string; children: React.ReactNode }) {
  const childArray = React.Children.toArray(children);
  return (
    <Card className="rounded-[2rem] border-[#dfe9fb] bg-white shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
      <CardContent className="space-y-4 p-6">
        <h2 className="text-xl font-black tracking-[-0.04em] text-slate-900">{title}</h2>
        <div className="space-y-3">
          {childArray.length > 0 ? childArray : <EmptyBlock text={emptyText} />}
        </div>
      </CardContent>
    </Card>
  );
}

function LessonRow({ lesson }: { lesson: StaffScheduleLessonDto }) {
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

function HomeworkRow({ assignment }: { assignment: TeacherStudentHomeworkDto }) {
  const activityNames = assignment.items.slice(0, 3).map((item) => item.title).filter(Boolean);
  const extraCount = Math.max(assignment.items.length - activityNames.length, 0);
  return (
    <div className="rounded-[1.35rem] border border-[#dfe9fb] bg-[#fbfdff] px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-black text-slate-900">{assignment.title}</p>
          <p className="mt-1 text-sm text-slate-600">
            {activityNames.join(" · ")}
            {extraCount > 0 ? ` · ещё ${extraCount}` : ""}
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">{formatRuLongDateTime(assignment.createdAt) || "Без даты"}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-white px-3 py-1 text-slate-700">{getHomeworkStatusLabel(assignment.status)}</span>
          <span className="rounded-full bg-[#eef5ff] px-3 py-1 text-[#1f7aff]">
            {assignment.completedRequiredCount} из {assignment.requiredCount}
          </span>
        </div>
      </div>
      {assignment.description ? <p className="mt-3 text-sm text-slate-600">{assignment.description}</p> : null}
    </div>
  );
}

function getHomeworkStatusLabel(status: string) {
  if (status === "completed") return "Завершено";
  if (status === "overdue") return "Просрочено";
  if (status === "in_progress") return "В работе";
  return "Не начато";
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
