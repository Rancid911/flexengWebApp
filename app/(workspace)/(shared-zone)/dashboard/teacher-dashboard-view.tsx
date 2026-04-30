import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, BookOpenCheck, CalendarClock, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { TeacherDashboardData } from "@/lib/teacher-workspace/types";
import { buildTeacherDashboardCriticalSections, buildTeacherDashboardSecondarySections } from "@/lib/teacher-workspace/sections";
import { formatScheduleDateLabel, formatScheduleTimeRange } from "@/lib/schedule/utils";

export default function TeacherDashboardView({
  data,
  profileLinked = true,
  studentRosterCount,
  studentRosterSlot,
  attentionQueueSlot
}: {
  data: TeacherDashboardData;
  profileLinked?: boolean;
  studentRosterCount?: number | null;
  studentRosterSlot?: ReactNode;
  attentionQueueSlot?: ReactNode;
}) {
  const criticalSections = buildTeacherDashboardCriticalSections(data);
  const secondarySections = buildTeacherDashboardSecondarySections(data);
  const rosterCount = studentRosterCount ?? secondarySections.studentRosterSummary.length;
  const rosterCountLabel = studentRosterCount == null ? "..." : String(rosterCount);

  return (
    <div className="space-y-4 pb-8">
      <section className="rounded-[2rem] border border-[#dfe9fb] bg-[linear-gradient(135deg,#0f172a_0%,#173969_52%,#1f7aff_100%)] p-6 text-white shadow-[0_20px_44px_rgba(15,23,42,0.18)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white/90">
              <CalendarClock className="h-3.5 w-3.5" />
              Кабинет преподавателя
            </span>
            <div>
              <h1 className="text-3xl font-black tracking-[-0.05em] sm:text-4xl">Рабочий день преподавателя в одном месте</h1>
              <p className="mt-2 max-w-3xl text-sm text-[#dbeafe] sm:text-base">
                Отслеживайте уроки на сегодня, ближайшую неделю и учеников, которые сейчас у вас в работе.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Сегодня" value={String(criticalSections.todayAgenda.length)} />
            <MetricCard label="На неделе" value={String(secondarySections.weekAgenda.length)} />
            <MetricCard label="Мои ученики" value={rosterCountLabel} />
          </div>
        </div>
      </section>

      {!profileLinked ? (
        <Card className="rounded-[1.75rem] border-amber-200 bg-amber-50 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
          <CardContent className="space-y-2 p-5">
            <h2 className="text-lg font-black tracking-[-0.03em] text-amber-950">Профиль преподавателя ещё не привязан</h2>
            <p className="text-sm leading-6 text-amber-900">
              Вход выполнен, но запись в таблице преподавателей ещё не связана с вашим профилем. Кабинет откроется полностью после привязки аккаунта администратором.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {attentionQueueSlot ?? (
        <TeacherDashboardAttentionSection lessons={criticalSections.weekAttentionQueue} />
      )}

      <section className="grid gap-4">
        <InfoCard
          title="Сегодня"
          icon={<CalendarClock className="h-5 w-5" />}
          empty="На сегодня уроков нет."
          items={criticalSections.todayAgenda.map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            meta: `${lesson.studentName} · ${formatScheduleTimeRange(lesson.startsAt, lesson.endsAt)}`,
            submeta: formatScheduleDateLabel(lesson.startsAt),
            href: "/schedule",
            badge: lesson.hasOutcome ? "Итог сохранён" : lesson.status === "completed" ? "Нужно заполнить итог" : "Ближайший урок"
          }))}
        />

        <InfoCard
          title="Эта неделя"
          icon={<BookOpenCheck className="h-5 w-5" />}
          empty="На ближайшие 7 дней уроков пока нет."
          items={secondarySections.weekAgenda.map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            meta: `${lesson.studentName} · ${formatScheduleDateLabel(lesson.startsAt)}`,
            submeta: formatScheduleTimeRange(lesson.startsAt, lesson.endsAt),
            href: "/schedule",
            badge: lesson.hasOutcome ? "Итог сохранён" : lesson.status === "completed" ? "Нужно заполнить итог" : "Запланирован"
          }))}
        />
      </section>

      {studentRosterSlot ?? <TeacherDashboardRosterSection students={secondarySections.studentRosterSummary} />}
    </div>
  );
}

export function TeacherDashboardAttentionSection({ lessons }: { lessons: TeacherDashboardData["weekLessons"] }) {
  return (
    <InfoCard
      title="Нужно заполнить итог"
      icon={<BookOpenCheck className="h-5 w-5" />}
      empty="Все завершённые уроки уже закрыты итогами."
      items={lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        meta: `${lesson.studentName} · ${formatScheduleDateLabel(lesson.startsAt)}`,
        submeta: "Завершённый урок без сохранённого follow-up",
        href: "/schedule",
        badge: "Нужно действие"
      }))}
    />
  );
}

export function TeacherDashboardRosterSection({ students }: { students: TeacherDashboardData["students"] }) {
  return (
    <Card className="rounded-[2rem] border-[#dfe9fb] bg-white shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
      <CardContent className="space-y-5 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black tracking-[-0.04em] text-slate-900">Мои ученики</h2>
            <p className="mt-1 text-sm text-slate-600">Переходите в профиль ученика, чтобы оставить заметку, посмотреть ошибки и последние уроки.</p>
          </div>
          <Link href="/schedule" className="inline-flex h-11 items-center rounded-2xl border border-[#dbe5f4] px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50">
            Открыть расписание
          </Link>
        </div>

        {students.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-[#d7e4f5] bg-[#f8fbff] px-5 py-10 text-sm text-slate-600">
            У вас пока нет привязанных активных учеников.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {students.map((student) => (
              <Link
                key={student.studentId}
                href={`/students/${student.studentId}`}
                className="group rounded-[1.5rem] border border-[#dfe9fb] bg-[#fbfdff] p-5 transition hover:border-slate-300 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black tracking-[-0.04em] text-slate-900">{student.studentName}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {student.englishLevel ?? "Уровень не задан"}{student.targetLevel ? ` → ${student.targetLevel}` : ""}
                    </p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef5ff] text-[#1f7aff]">
                    <Users className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p>Активных homework: {student.activeHomeworkCount}</p>
                  <p>{student.nextLessonAt ? `Следующий урок: ${formatScheduleDateLabel(student.nextLessonAt)}` : "Следующий урок пока не назначен"}</p>
                </div>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#1f7aff]">
                  Открыть профиль
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[140px] rounded-[1.4rem] border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
      <div className="text-sm text-white/75">{label}</div>
      <div className="mt-1 text-3xl font-black tracking-[-0.05em] text-white">{value}</div>
    </div>
  );
}

function InfoCard({
  title,
  icon,
  empty,
  items
}: {
  title: string;
  icon: ReactNode;
  empty: string;
  items: Array<{ id: string; title: string; meta: string; submeta?: string; href: string; badge?: string }>;
}) {
  return (
    <Card className="rounded-[1.75rem] border-[#dfe9fb] bg-white shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
      <CardContent className="space-y-3 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black tracking-[-0.04em] text-slate-900">{title}</h2>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef5ff] text-[#1f7aff]">{icon}</span>
        </div>
        {items.length === 0 ? (
          <div className="rounded-[1.2rem] border border-dashed border-[#d7e4f5] bg-[#f8fbff] px-4 py-4 text-sm text-slate-600">{empty}</div>
        ) : (
          <div data-testid={`teacher-dashboard-grid-${title}`} className="grid gap-2.5 lg:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="block rounded-[1.2rem] border border-[#dfe9fb] bg-white px-3.5 py-3 transition hover:bg-[#fafdff]"
              >
                {item.badge ? (
                  <span className="inline-flex rounded-full bg-[#eef5ff] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#1f7aff]">
                    {item.badge}
                  </span>
                ) : null}
                <p className="font-black text-slate-900">{item.title}</p>
                <p className="mt-0.5 text-sm text-slate-600">{item.meta}</p>
                {item.submeta ? <p className="mt-0.5 text-sm text-slate-500">{item.submeta}</p> : null}
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
