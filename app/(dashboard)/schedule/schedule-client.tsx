"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { CalendarClock, CalendarPlus2, Clock3, Link2, Loader2, Pencil, Plus, RefreshCcw, UserRound, Video, XCircle } from "lucide-react";

import { AdminDrawer } from "@/app/(dashboard)/admin/ui/admin-drawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DateField } from "@/components/ui/date-field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  SchedulePageData,
  ScheduleStudentOptionDto,
  ScheduleTeacherOptionDto,
  StaffScheduleLessonDto,
  StaffSchedulePageData,
  StudentScheduleLessonDto
} from "@/lib/schedule/types";
import {
  formatScheduleDateLabel,
  formatScheduleTimeRange,
  getScheduleStatusLabel,
  getScheduleStatusTone,
  groupLessonsByDate
} from "@/lib/schedule/utils";

type LessonFormState = {
  id: string | null;
  studentId: string;
  teacherId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingUrl: string;
  comment: string;
  status: "scheduled" | "completed" | "canceled";
};

type ScheduleClientProps = {
  initialData: SchedulePageData;
};

const fieldClassName =
  "h-11 w-full rounded-2xl border border-[#dbe5f4] bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#82a7ff]";

function toLocalDateInput(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toLocalTimeInput(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function composeIsoDateTime(date: string, time: string) {
  if (!date || !time) return "";
  const localDate = new Date(`${date}T${time}:00`);
  return Number.isNaN(localDate.getTime()) ? "" : localDate.toISOString();
}

function buildLessonFormState(
  lesson: StaffScheduleLessonDto | null,
  students: ScheduleStudentOptionDto[],
  teachers: ScheduleTeacherOptionDto[]
): LessonFormState {
  if (lesson) {
    return {
      id: lesson.id,
      studentId: lesson.studentId,
      teacherId: lesson.teacherId,
      title: lesson.title,
      date: toLocalDateInput(lesson.startsAt),
      startTime: toLocalTimeInput(lesson.startsAt),
      endTime: toLocalTimeInput(lesson.endsAt),
      meetingUrl: lesson.meetingUrl ?? "",
      comment: lesson.comment ?? "",
      status: lesson.status
    };
  }

  return {
    id: null,
    studentId: students[0]?.id ?? "",
    teacherId: teachers[0]?.id ?? "",
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    meetingUrl: "",
    comment: "",
    status: "scheduled"
  };
}

async function parseApiResponse(response: Response) {
  if (response.ok) return response.json();
  const payload = (await response.json().catch(() => null)) as { message?: string } | null;
  throw new Error(payload?.message || "Не удалось выполнить запрос");
}

export function getStatusBadgeClass(tone: ReturnType<typeof getScheduleStatusTone>) {
  switch (tone) {
    case "emerald":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "rose":
      return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    default:
      return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
  }
}

export function ScheduleClient({ initialData }: ScheduleClientProps) {
  if (initialData.role === "student") {
    return <StudentScheduleView data={initialData} />;
  }

  return <StaffScheduleView initialData={initialData} />;
}

function StudentScheduleView({ data }: { data: Extract<SchedulePageData, { role: "student" }> }) {
  const groupedLessons = groupLessonsByDate(data.lessons);

  return (
    <div className="space-y-5 pb-8">
      <section className="rounded-[2rem] border border-[#dfe9fb] bg-[linear-gradient(135deg,#0f4c81_0%,#1f7aff_55%,#6ec4ff_100%)] p-6 text-white shadow-[0_20px_44px_rgba(31,122,255,0.18)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
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

          <Card className="min-w-[280px] rounded-[1.6rem] border-white/15 bg-white/10 text-white shadow-none backdrop-blur-sm">
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
        <Card className="rounded-[2rem] border-dashed border-[#d7e4f5] bg-[#f8fbff] shadow-none">
          <CardContent className="flex flex-col items-start gap-3 p-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#1f7aff] shadow-sm">
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
            <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-black", getStatusBadgeClass(getScheduleStatusTone(lesson.status)))}>
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

function StaffScheduleView({ initialData }: { initialData: StaffSchedulePageData }) {
  const [lessons, setLessons] = useState(initialData.lessons);
  const [filters, setFilters] = useState(initialData.filters);
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState(() => buildLessonFormState(null, initialData.students, initialData.teachers));
  const deferredFilters = useDeferredValue(filters);

  useEffect(() => {
    const params = new URLSearchParams();
    if (deferredFilters.studentId) params.set("studentId", deferredFilters.studentId);
    if (deferredFilters.teacherId) params.set("teacherId", deferredFilters.teacherId);
    if (deferredFilters.status && deferredFilters.status !== "all") params.set("status", deferredFilters.status);
    if (deferredFilters.dateFrom) params.set("dateFrom", deferredFilters.dateFrom);
    if (deferredFilters.dateTo) params.set("dateTo", deferredFilters.dateTo);

    let cancelled = false;
    setIsLoading(true);
    setActionError("");

    fetch(`/api/schedule?${params.toString()}`, { cache: "no-store" })
      .then(parseApiResponse)
      .then((payload) => {
        if (cancelled) return;
        startTransition(() => {
          setLessons(payload.lessons as StaffScheduleLessonDto[]);
        });
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setActionError(error.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [deferredFilters]);

  const groupedLessons = useMemo(() => groupLessonsByDate(lessons), [lessons]);

  const openCreateDrawer = () => {
    setActionError("");
    setFormState(buildLessonFormState(null, initialData.students, initialData.teachers));
    setDrawerOpen(true);
  };

  const openEditDrawer = (lesson: StaffScheduleLessonDto) => {
    setActionError("");
    setFormState(buildLessonFormState(lesson, initialData.students, initialData.teachers));
    setDrawerOpen(true);
  };

  const refreshLessons = async () => {
    const params = new URLSearchParams();
    if (filters.studentId) params.set("studentId", filters.studentId);
    if (filters.teacherId) params.set("teacherId", filters.teacherId);
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);

    setIsLoading(true);
    const payload = await parseApiResponse(await fetch(`/api/schedule?${params.toString()}`, { cache: "no-store" }));
    startTransition(() => {
      setLessons(payload.lessons as StaffScheduleLessonDto[]);
    });
    setIsLoading(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setActionError("");

    try {
      const startsAt = composeIsoDateTime(formState.date, formState.startTime);
      const endsAt = composeIsoDateTime(formState.date, formState.endTime);
      const payload = {
        studentId: formState.studentId,
        teacherId: formState.teacherId,
        title: formState.title,
        startsAt,
        endsAt,
        meetingUrl: formState.meetingUrl || null,
        comment: formState.comment || null,
        status: formState.status
      };

      const response = await fetch(formState.id ? `/api/schedule/${formState.id}` : "/api/schedule", {
        method: formState.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      await parseApiResponse(response);
      setDrawerOpen(false);
      await refreshLessons();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Не удалось сохранить урок");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusAction = async (lesson: StaffScheduleLessonDto, action: "completed" | "canceled") => {
    setActionError("");
    setSaving(true);

    try {
      const response =
        action === "canceled"
          ? await fetch(`/api/schedule/${lesson.id}`, { method: "DELETE" })
          : await fetch(`/api/schedule/${lesson.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "completed" })
            });
      await parseApiResponse(response);
      await refreshLessons();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Не удалось обновить статус урока");
    } finally {
      setSaving(false);
    }
  };

  const scheduledCount = useMemo(() => lessons.filter((lesson) => lesson.status === "scheduled").length, [lessons]);

  return (
    <div className="space-y-5 pb-8">
      <section className="rounded-[2rem] border border-[#dfe9fb] bg-[linear-gradient(135deg,#0f172a_0%,#1f3d7a_55%,#2563eb_100%)] p-6 text-white shadow-[0_20px_44px_rgba(15,23,42,0.18)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white/90">
              <CalendarClock className="h-3.5 w-3.5" />
              Расписание
            </span>
            <div>
              <h1 className="text-3xl font-black tracking-[-0.05em] sm:text-4xl">Планирование уроков для учеников</h1>
              <p className="mt-2 max-w-3xl text-sm text-[#dbeafe] sm:text-base">
                Создавайте разовые занятия, переносите их и отслеживайте ближайшие слоты. Ученики увидят только будущие подтверждённые уроки.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <MetricCard label="Всего в ленте" value={String(lessons.length)} />
            <MetricCard label="Активных уроков" value={String(scheduledCount)} />
          </div>
        </div>
      </section>

      <Card className="rounded-[2rem] border-[#dfe9fb] bg-white shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-black tracking-[-0.04em] text-slate-900">Агенда уроков</h2>
              <p className="mt-1 text-sm text-slate-600">
                {initialData.teacherLocked
                  ? "Показываем только ваших учеников и ваши уроки."
                  : "Фильтруйте список по ученику, преподавателю, статусу и дате."}
              </p>
            </div>
            <Button type="button" onClick={openCreateDrawer} className="h-11 rounded-2xl bg-[#1f7aff] px-4 font-black text-white hover:bg-[#1669db]">
              <Plus className="mr-2 h-4 w-4" />
              Назначить урок
            </Button>
          </div>

          <div className="grid gap-3 lg:grid-cols-5">
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Ученик</span>
              <select
                value={filters.studentId}
                onChange={(event) => setFilters((current) => ({ ...current, studentId: event.target.value }))}
                className={fieldClassName}
              >
                <option value="">Все ученики</option>
                {initialData.students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Преподаватель</span>
              <select
                value={filters.teacherId}
                onChange={(event) => setFilters((current) => ({ ...current, teacherId: event.target.value }))}
                disabled={initialData.teacherLocked}
                className={fieldClassName}
              >
                {!initialData.teacherLocked ? <option value="">Все преподаватели</option> : null}
                {initialData.teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Статус</span>
              <select
                value={filters.status}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as typeof current.status }))}
                className={fieldClassName}
              >
                <option value="all">Все статусы</option>
                <option value="scheduled">Запланирован</option>
                <option value="completed">Проведён</option>
                <option value="canceled">Отменён</option>
              </select>
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>С даты</span>
              <DateField value={filters.dateFrom} onChange={(value) => setFilters((current) => ({ ...current, dateFrom: value }))} />
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>По дату</span>
              <DateField value={filters.dateTo} onChange={(value) => setFilters((current) => ({ ...current, dateTo: value }))} />
            </label>
          </div>

          {actionError ? <ErrorBanner message={actionError} /> : null}

          {isLoading ? (
            <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Обновляю расписание…
            </div>
          ) : groupedLessons.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-[#d7e4f5] bg-[#f8fbff] px-5 py-10 text-sm text-slate-600">
              По текущим фильтрам занятий нет. Назначьте первый урок или измените фильтры.
            </div>
          ) : (
            groupedLessons.map((group) => (
              <section key={group.key} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-black tracking-[-0.04em] text-slate-900">{group.label}</h3>
                  <span className="text-sm text-slate-500">{group.lessons.length} урока</span>
                </div>
                <div className="grid gap-4">
                  {group.lessons.map((lesson) => (
                    <StaffLessonCard
                      key={lesson.id}
                      lesson={lesson as StaffScheduleLessonDto}
                      onEdit={openEditDrawer}
                      onComplete={handleStatusAction}
                      loading={saving}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </CardContent>
      </Card>

      <AdminDrawer open={drawerOpen} title={formState.id ? "Редактировать урок" : "Новый урок"} onClose={() => setDrawerOpen(false)} widthClass="max-w-2xl">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Ученик</span>
              <select
                value={formState.studentId}
                onChange={(event) => setFormState((current) => ({ ...current, studentId: event.target.value }))}
                className={fieldClassName}
                required
              >
                {initialData.students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Преподаватель</span>
              <select
                value={formState.teacherId}
                onChange={(event) => setFormState((current) => ({ ...current, teacherId: event.target.value }))}
                disabled={initialData.teacherLocked}
                className={fieldClassName}
                required
              >
                {initialData.teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Название урока</span>
            <Input value={formState.title} onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))} className={fieldClassName} required />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Дата</span>
              <DateField value={formState.date} onChange={(value) => setFormState((current) => ({ ...current, date: value }))} />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Начало</span>
              <Input
                type="time"
                value={formState.startTime}
                onChange={(event) => setFormState((current) => ({ ...current, startTime: event.target.value }))}
                className={fieldClassName}
                required
              />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Конец</span>
              <Input
                type="time"
                value={formState.endTime}
                onChange={(event) => setFormState((current) => ({ ...current, endTime: event.target.value }))}
                className={fieldClassName}
                required
              />
            </label>
          </div>

          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Ссылка на встречу</span>
            <Input
              type="url"
              value={formState.meetingUrl}
              onChange={(event) => setFormState((current) => ({ ...current, meetingUrl: event.target.value }))}
              className={fieldClassName}
              placeholder="https://meet.google.com/..."
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Комментарий</span>
            <textarea
              value={formState.comment}
              onChange={(event) => setFormState((current) => ({ ...current, comment: event.target.value }))}
              rows={4}
              className="w-full rounded-[1.3rem] border border-[#dbe5f4] bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#82a7ff]"
              placeholder="Например: подготовить speaking warm-up и ссылку на материалы."
            />
          </label>

          {actionError ? <ErrorBanner message={actionError} /> : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
            <div className="text-sm text-slate-500">Ученик увидит только будущие запланированные уроки.</div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setDrawerOpen(false)} className="rounded-2xl">
                Отмена
              </Button>
              <Button type="submit" disabled={saving} className="rounded-2xl bg-[#1f7aff] font-black text-white hover:bg-[#1669db]">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarPlus2 className="mr-2 h-4 w-4" />}
                {formState.id ? "Сохранить" : "Назначить урок"}
              </Button>
            </div>
          </div>
        </form>
      </AdminDrawer>
    </div>
  );
}

function StaffLessonCard({
  lesson,
  onEdit,
  onComplete,
  loading
}: {
  lesson: StaffScheduleLessonDto;
  onEdit: (lesson: StaffScheduleLessonDto) => void;
  onComplete: (lesson: StaffScheduleLessonDto, action: "completed" | "canceled") => void;
  loading: boolean;
}) {
  return (
    <Card className="rounded-[1.6rem] border-[#dfe9fb] bg-white shadow-none">
      <CardContent className="flex flex-col gap-4 p-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-black", getStatusBadgeClass(getScheduleStatusTone(lesson.status)))}>
              {getScheduleStatusLabel(lesson.status)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              <Clock3 className="h-3.5 w-3.5" />
              {formatScheduleTimeRange(lesson.startsAt, lesson.endsAt)}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-black tracking-[-0.04em] text-slate-900">{lesson.title}</h3>
            <p className="mt-1 text-sm text-slate-600">
              {lesson.studentName} · {lesson.teacherName}
            </p>
          </div>
          {lesson.comment ? <p className="max-w-3xl text-sm leading-6 text-slate-600">{lesson.comment}</p> : null}
          <div className="flex flex-wrap gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="h-4 w-4" />
              {formatScheduleDateLabel(lesson.startsAt)}
            </span>
            {lesson.meetingUrl ? (
              <a href={lesson.meetingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[#1f7aff] hover:text-[#1669db]">
                <Link2 className="h-4 w-4" />
                Ссылка на встречу
              </a>
            ) : null}
          </div>
        </div>

        <div
          data-testid="staff-lesson-actions"
          className="flex flex-col gap-2 border-t border-slate-100 pt-4 xl:ml-4 xl:w-auto xl:shrink-0 xl:border-t-0 xl:pt-0"
        >
          <Button type="button" variant="outline" className="h-11 rounded-2xl whitespace-nowrap" onClick={() => onEdit(lesson)}>
            <Pencil className="mr-2 h-4 w-4" />
            Изменить
          </Button>
          {lesson.status === "scheduled" ? (
            <>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-2xl whitespace-nowrap"
                disabled={loading}
                onClick={() => onComplete(lesson, "completed")}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Отметить проведённым
              </Button>
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
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</div>;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[160px] rounded-[1.4rem] border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
      <div className="text-sm text-white/75">{label}</div>
      <div className="mt-1 text-3xl font-black tracking-[-0.05em] text-white">{value}</div>
    </div>
  );
}
