"use client";

import Link from "next/link";
import { CalendarClock, Clock3, Link2, Pencil, RefreshCcw, UserRound, Video, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SchedulePageData, StaffScheduleLessonDto, StudentScheduleLessonDto } from "@/lib/schedule/types";
import {
  formatScheduleDateLabel,
  formatScheduleTimeRange,
  getAttendanceStatusShortLabel,
  getScheduleStatusLabel,
  getScheduleStatusTone,
  groupLessonsByDate,
  hasLessonEnded
} from "@/lib/schedule/utils";

function getStatusBadgeClass(tone: ReturnType<typeof getScheduleStatusTone>) {
  switch (tone) {
    case "emerald":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "rose":
      return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    default:
      return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
  }
}

function getStudentStatusBadgeClass(tone: ReturnType<typeof getScheduleStatusTone>) {
  if (tone === "sky") {
    return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
  }

  return getStatusBadgeClass(tone);
}

export function StudentScheduleView({ data }: { data: Extract<SchedulePageData, { role: "student" }> }) {
  const groupedLessons = groupLessonsByDate(data.lessons);

  return (
    <div className="space-y-5 pb-8">
      <section
        data-testid="student-schedule-hero"
        className="relative overflow-hidden rounded-[2rem] border border-[#6F679F] bg-[linear-gradient(135deg,#2D284A_0%,#3E3762_46%,#4A4476_100%)] p-6 text-white shadow-[0_20px_48px_rgba(25,18,46,0.28)]"
      >
        <div className="hero-blob hero-blob-a" />
        <div className="hero-blob hero-blob-b" />
        <div className="hero-blob hero-blob-c" />
        <div className="hero-blob hero-blob-d" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white/90">
              <CalendarClock className="h-3.5 w-3.5" />
              Расписание
            </span>
            <div>
              <h1 className="text-3xl font-black tracking-[-0.05em] sm:text-4xl">Все будущие уроки в одном месте</h1>
              <p className="mt-2 max-w-2xl text-sm text-[#ecf6ff] sm:text-base">
                Здесь появляются только подтверждённые уроки. Откройте ссылку на встречу прямо из карточки занятия.
              </p>
            </div>
          </div>

          <Card className="min-w-[280px] rounded-[1.6rem] border-white/15 bg-[#403A67]/72 text-white shadow-none backdrop-blur-sm">
            <CardContent className="space-y-2 p-5">
              <p className="text-sm font-semibold text-white/80">Ближайший урок</p>
              {data.nextLesson ? (
                <>
                  <p className="text-2xl font-black tracking-[-0.04em]">{data.nextLesson.title}</p>
                  <p className="text-sm text-white/85">{formatScheduleDateLabel(data.nextLesson.startsAt)}</p>
                  <p className="text-sm text-white/85">{formatScheduleTimeRange(data.nextLesson.startsAt, data.nextLesson.endsAt)}</p>
                  <p className="text-sm text-white/75">Преподаватель: {data.nextLesson.teacherName}</p>
                </>
              ) : (
                <p className="text-sm text-white/85">Пока нет новых уроков. Как только преподаватель назначит занятие, оно появится здесь.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {groupedLessons.length === 0 ? (
        <Card className="rounded-[2rem] border-dashed border-[#ded8ff] bg-[#f7f4ff] shadow-none">
          <CardContent className="flex flex-col items-start gap-3 p-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#6658f5] shadow-sm">
              <CalendarClock className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <h2 className="text-xl font-black tracking-[-0.04em] text-slate-900">Пока уроки не назначены</h2>
              <p className="max-w-xl text-sm text-slate-600">Когда преподаватель или менеджер создаст новые занятия, они появятся в этом разделе автоматически.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        groupedLessons.map((group) => (
          <section key={group.key} className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black tracking-[-0.04em] text-slate-900">{group.label}</h2>
              <span className="text-sm text-slate-500">{group.lessons.length} урока</span>
            </div>
            <div className="grid gap-4">
              {group.lessons.map((lesson) => (
                <StudentLessonCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function StudentLessonCard({ lesson }: { lesson: StudentScheduleLessonDto }) {
  return (
    <Card className="rounded-[1.8rem] border-[#dfe9fb] bg-white shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
      <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-black", getStudentStatusBadgeClass(getScheduleStatusTone(lesson.status)))}>
              {getScheduleStatusLabel(lesson.status)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              <Clock3 className="h-3.5 w-3.5" />
              {formatScheduleTimeRange(lesson.startsAt, lesson.endsAt)}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-black tracking-[-0.04em] text-slate-900">{lesson.title}</h3>
            <p className="mt-1 text-sm text-slate-600">Преподаватель: {lesson.teacherName}</p>
          </div>
          {lesson.comment ? <p className="max-w-3xl text-sm leading-6 text-slate-600">{lesson.comment}</p> : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {lesson.meetingUrl ? (
            <a
              href={lesson.meetingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#1f7aff] px-4 text-sm font-black text-white shadow-[0_12px_24px_rgba(31,122,255,0.2)] transition hover:bg-[#1669db]"
            >
              <Video className="h-4 w-4" />
              Подключиться
            </a>
          ) : (
            <span className="inline-flex h-11 items-center rounded-2xl bg-slate-100 px-4 text-sm font-semibold text-slate-500">
              Ссылка появится позже
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function StaffLessonCard({
  lesson,
  onEdit,
  onComplete,
  onFollowup,
  referenceNow,
  loading
}: {
  lesson: StaffScheduleLessonDto;
  onEdit: (lesson: StaffScheduleLessonDto) => void;
  onComplete: (lesson: StaffScheduleLessonDto, action: "completed" | "canceled") => void;
  onFollowup: (lesson: StaffScheduleLessonDto) => void | Promise<void>;
  referenceNow: Date;
  loading: boolean;
}) {
  const followupLabel =
    lesson.status === "completed"
      ? lesson.hasOutcome
        ? "Открыть итог"
        : "Заполнить итог"
      : "Отметить проведённым";
  const canMarkCompleted = lesson.status === "completed" || hasLessonEnded(lesson.endsAt, referenceNow);

  return (
    <Card className="rounded-[1.6rem] border-[#dfe9fb] bg-white shadow-none">
      <CardContent className="flex flex-col gap-4 p-5 xl:flex-row xl:items-stretch xl:justify-between">
        <div className="flex flex-col gap-3 xl:min-h-full xl:flex-1 xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-black", getStatusBadgeClass(getScheduleStatusTone(lesson.status)))}>
              {getScheduleStatusLabel(lesson.status)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              <Clock3 className="h-3.5 w-3.5" />
              {formatScheduleTimeRange(lesson.startsAt, lesson.endsAt)}
            </span>
          </div>

          <div data-testid="staff-lesson-main-content" className="space-y-3 xl:mt-auto">
            <div>
              <h3 className="text-lg font-black tracking-[-0.04em] text-slate-900">{lesson.title}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {lesson.studentName} · {lesson.teacherName}
              </p>
            </div>
            {lesson.comment ? <p className="max-w-3xl text-sm leading-6 text-slate-600">{lesson.comment}</p> : null}
            {lesson.studentVisibleOutcome ? (
              <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-900">
                <p className="font-black">Итог опубликован ученику</p>
                <p className="mt-1 leading-6">{lesson.studentVisibleOutcome.summary}</p>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <UserRound className="h-4 w-4" />
                {formatScheduleDateLabel(lesson.startsAt)}
              </span>
              {lesson.attendanceStatus ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-slate-600">
                  Посещаемость: {getAttendanceStatusShortLabel(lesson.attendanceStatus)}
                </span>
              ) : null}
              {lesson.meetingUrl ? (
                <a href={lesson.meetingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[#1f7aff] hover:text-[#1669db]">
                  <Link2 className="h-4 w-4" />
                  Ссылка на встречу
                </a>
              ) : null}
              {lesson.status === "completed" && !lesson.hasOutcome ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-amber-700">
                  Нужно заполнить итог
                </span>
              ) : null}
              {lesson.hasOutcome ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-emerald-700">
                  Итог сохранён
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div
          data-testid="staff-lesson-actions"
          className="flex flex-col gap-2 border-t border-slate-100 pt-4 xl:ml-4 xl:w-auto xl:shrink-0 xl:border-t-0 xl:pt-0"
        >
          <Link
            href={`/students/${lesson.studentId}`}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#dbe5f4] px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            Открыть ученика
          </Link>
          <Button type="button" variant="outline" className="h-11 rounded-2xl whitespace-nowrap" onClick={() => onEdit(lesson)}>
            <Pencil className="mr-2 h-4 w-4" />
            Изменить
          </Button>
          {lesson.status !== "canceled" ? (
            <>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-2xl whitespace-nowrap"
                disabled={loading || (lesson.status === "scheduled" && !canMarkCompleted)}
                onClick={() => onFollowup(lesson)}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                {followupLabel}
              </Button>
              {lesson.status === "scheduled" ? (
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-2xl whitespace-nowrap border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                disabled={loading}
                onClick={() => onComplete(lesson, "canceled")}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Отменить
              </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[160px] rounded-[1.4rem] border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
      <div className="text-sm text-white/75">{label}</div>
      <div className="mt-1 text-3xl font-black tracking-[-0.05em] text-white">{value}</div>
    </div>
  );
}
