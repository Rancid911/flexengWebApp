"use client";

import {
  ArrowRight,
  Brain,
  BookOpen,
  CalendarClock,
  CalendarCheck2,
  ClipboardCheck,
  Clock3,
  Layers,
  Link2,
  Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";

import { StudentPaymentReminderPanel } from "@/features/dashboard/components/student-payment-reminder-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { StudentDashboardCoreData, StudentDashboardData } from "@/lib/dashboard/student-dashboard";
import { formatScheduleDateLabel, formatScheduleTimeRange } from "@/lib/schedule/utils";

type DashboardBadgeTone = "primary" | "warning" | "muted";

export default function StudentDashboardView({
  data,
  recommendationsSlot,
  scheduleSlot,
  summaryStatsSlot
}: {
  data: StudentDashboardCoreData | StudentDashboardData;
  recommendationsSlot?: React.ReactNode;
  scheduleSlot?: React.ReactNode;
  summaryStatsSlot?: React.ReactNode;
}) {
  const router = useRouter();
  const { lessonOfTheDay, progress, heroStats, homeworkCards, activeHomeworkCount, recommendationCards, nextBestAction, summaryStats, nextScheduledLesson } = data;

  return (
    <div className="space-y-4 pb-8">
      {"paymentReminderPopup" in data && data.paymentReminderPopup ? <StudentPaymentReminderPanel popup={data.paymentReminderPopup} /> : null}

      <section className="relative overflow-hidden rounded-[1.75rem] border border-[#cfe0f8] bg-[#2155d8] text-white shadow-[0_22px_52px_rgba(37,86,216,0.22)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[url('/images/dashboard/student-dashboard-study-hero.png')] bg-cover bg-[center_right_24%] opacity-95"
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(33,78,207,0.98)_0%,rgba(45,92,219,0.94)_32%,rgba(58,112,225,0.62)_58%,rgba(215,231,255,0.16)_100%)]" />
        <div className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.15fr_0.78fr] lg:items-center lg:p-7">
          <div className="space-y-5 lg:max-w-[640px]">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-black text-[#2458d8] shadow-[0_10px_24px_rgba(18,32,59,0.12)]">
              <BookOpen className="h-3.5 w-3.5" />
              Урок дня
            </span>
            <div className="space-y-3">
              <h1 className="text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">{lessonOfTheDay.title}</h1>
              <p className="max-w-xl text-sm leading-6 text-[#edf5ff] sm:text-base">{lessonOfTheDay.description}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <MetaPill icon={<Clock3 className="h-4 w-4" />} text={lessonOfTheDay.duration} />
              <MetaPill icon={<CalendarCheck2 className="h-4 w-4" />} text={`${lessonOfTheDay.progress}% пройдено`} />
              <MetaPill icon={<Layers className="h-4 w-4" />} text={lessonOfTheDay.sectionsLabel ?? `${lessonOfTheDay.sectionsCount} разделов в курсе`} />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                className="h-12 rounded-[1.1rem] bg-[#ffd229] px-6 font-black text-[#17233f] shadow-[0_16px_30px_rgba(255,210,41,0.28)] hover:bg-[#ffe174]"
                onClick={() => router.push("/practice")}
              >
                Продолжить
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-[1.1rem] border-white/35 bg-white/10 px-5 font-black text-white hover:border-white/50 hover:bg-white/16 hover:text-white"
                onClick={() => router.push("/practice")}
              >
                Открыть практику
              </Button>
            </div>
          </div>

          <Card className="rounded-[1.5rem] border-white/70 bg-white/95 text-[#12203b] shadow-[0_24px_56px_rgba(18,32,59,0.18)] backdrop-blur-sm">
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div>
                <p className="text-sm font-semibold text-[#66789e]">Прогресс по теме</p>
                <p className="mt-2 text-5xl font-black tracking-[-0.06em] text-[#2d49d8]">{progress.value}%</p>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#e9eef7]">
                  <span
                    className="block h-full rounded-full bg-[linear-gradient(90deg,#2b6fff_0%,#6b59ff_100%)] transition-[width] duration-500"
                    style={{ width: `${Math.max(0, Math.min(progress.value, 100))}%` }}
                  />
                </div>
                <p className="mt-3 text-sm leading-5 text-[#66789e]">{progress.label}</p>
              </div>
              <div className="space-y-3 border-t border-[#e7edf8] pt-2">
                {heroStats.map((item) => (
                  <HeroInfoCard key={item.label} label={item.label} value={item.value} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1.12fr_1.04fr_0.82fr]">
        <Card className="rounded-[1.6rem] border-[#cfe0f8] bg-white shadow-[0_16px_42px_rgba(27,73,155,0.08)] lg:col-span-2 xl:col-span-3">
          <CardContent className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#eaf4ff] text-[#1f7aff]">
              <Sparkles className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[#6b84ab]">Следующий шаг</h2>
              <p className="mt-1 text-lg font-black tracking-[-0.04em] text-[#12203b]">{nextBestAction.title}</p>
              <p className="mt-1 max-w-3xl text-sm leading-5 text-[#6d7fa3]">{nextBestAction.description}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:w-[250px] lg:flex-col">
              <Button type="button" className="h-11 rounded-[1rem] bg-[#2458e6] px-4 font-black text-white hover:bg-[#1f4ecd]" onClick={() => router.push(nextBestAction.primaryHref)}>
                {nextBestAction.primaryLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {nextBestAction.secondaryHref && nextBestAction.secondaryLabel ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-[1rem] border-[#d7e5fb] bg-white px-4 font-black text-[#1f7aff] hover:bg-[#f7fbff]"
                  onClick={() => router.push(nextBestAction.secondaryHref!)}
                >
                  {nextBestAction.secondaryLabel}
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.6rem] border-[#dfe9fb] bg-white shadow-[0_16px_42px_rgba(27,73,155,0.08)]">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f4ebff] text-[#7c3cff]">
                  <ClipboardCheck className="h-5 w-5" />
                </span>
                <h2 className="text-xl font-black tracking-[-0.03em] text-[#12203b]">Домашние задания</h2>
              </div>
              <StatusBadge tone="warning">{`${activeHomeworkCount} активных`}</StatusBadge>
            </div>
            <div className="space-y-3">
              {homeworkCards.length > 0 ? (
                <>
                  {homeworkCards.map((item, index) => (
                    <button
                      key={`${item.id}-${index}`}
                      type="button"
                      onClick={() => router.push("/homework")}
                      className="flex w-full items-center justify-between gap-4 rounded-[1.15rem] border border-[#dfe9fb] bg-white px-4 py-4 text-left transition hover:border-[#c7dbff] hover:bg-[#fafdff]"
                    >
                      <div>
                        <p className="font-black text-[#12203b]">{item.title}</p>
                        <p className="mt-1 text-sm text-[#6d7fa3]">{item.subtitle}</p>
                      </div>
                      <StatusBadge tone={item.statusTone}>{item.status}</StatusBadge>
                    </button>
                  ))}
                  {activeHomeworkCount > homeworkCards.length ? (
                    <button
                      type="button"
                      onClick={() => router.push("/homework")}
                      className="inline-flex items-center gap-2 text-sm font-black text-[#1f7aff] transition hover:text-[#1669db]"
                    >
                      Все домашние задания
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : null}
                </>
              ) : (
                <div className="rounded-[1.15rem] border border-dashed border-[#dfe9fb] bg-[#f8fbff] px-4 py-5 text-sm text-[#6d7fa3]">
                  Активных домашних заданий пока нет.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.6rem] border-[#dfe9fb] bg-white shadow-[0_16px_42px_rgba(27,73,155,0.08)]">
          <CardContent className="space-y-4 p-5">
            {recommendationsSlot ?? <StudentDashboardRecommendationsSection recommendationCards={recommendationCards} />}
          </CardContent>
        </Card>

        {scheduleSlot ?? <StudentDashboardScheduleSection nextScheduledLesson={nextScheduledLesson} />}
      </section>

      {summaryStatsSlot ?? <StudentDashboardSummaryStatsSection summaryStats={summaryStats} />}
    </div>
  );
}

export function StudentDashboardRecommendationsSection({
  recommendationCards
}: {
  recommendationCards: StudentDashboardCoreData["recommendationCards"];
}) {
  const router = useRouter();

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e9fbf2] text-[#10a36a]">
            <BookOpen className="h-5 w-5" />
          </span>
          <h2 className="text-xl font-black tracking-[-0.03em] text-[#12203b]">Продолжить обучение</h2>
        </div>
        <StatusBadge tone="primary">Практика</StatusBadge>
      </div>
      <div className="space-y-3">
        {recommendationCards.length > 0 ? (
          recommendationCards.map((item, index) => (
            <button
              key={`${item.id}-${index}`}
              type="button"
              onClick={() => router.push(item.href)}
              className="flex w-full items-center justify-between gap-4 rounded-[1.15rem] border border-[#dfe9fb] bg-white px-4 py-4 text-left transition hover:border-[#c7dbff] hover:bg-[#fafdff]"
            >
              <div>
                <p className="font-black text-[#12203b]">{item.title}</p>
                <p className="mt-1 text-sm text-[#6d7fa3]">{item.subtitle}</p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#dfe9fb] bg-[#f5f9ff] text-[#1f7aff]">
                <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          ))
        ) : (
          <div className="rounded-[1.15rem] border border-dashed border-[#dfe9fb] bg-[#f8fbff] px-4 py-5 text-sm text-[#6d7fa3]">
            Когда появятся пройденные drills и тесты, здесь можно будет быстро вернуться к последним темам.
          </div>
        )}
      </div>
    </>
  );
}

export function StudentDashboardScheduleSection({
  nextScheduledLesson
}: {
  nextScheduledLesson: StudentDashboardCoreData["nextScheduledLesson"];
}) {
  return (
    <Card className="rounded-[1.6rem] border-[#f1dcae] bg-[linear-gradient(180deg,#fffaf0_0%,#ffffff_62%)] shadow-[0_16px_42px_rgba(192,134,29,0.1)] lg:col-span-2 xl:col-span-1">
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff1ce] text-[#e68a00]">
              <CalendarClock className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-black tracking-[-0.03em] text-[#12203b]">Ближайшие уроки</h2>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#fff7e5] text-[#e68a00]">
            <CalendarClock className="h-4 w-4" />
          </span>
        </div>

        {nextScheduledLesson ? (
          <div className="mt-4 flex h-full flex-col rounded-[1.15rem] border border-[#f2dfb5] bg-white px-4 py-4">
            <h3 className="text-lg font-black leading-tight tracking-[-0.04em] text-[#12203b]">{nextScheduledLesson.title}</h3>
            <div className="mt-3 space-y-1.5 text-sm text-[#587198]">
              <p>{formatScheduleDateLabel(nextScheduledLesson.startsAt)}</p>
              <p>Время: {formatScheduleTimeRange(nextScheduledLesson.startsAt, nextScheduledLesson.endsAt)}</p>
              <p>Учитель: {nextScheduledLesson.teacherName}</p>
            </div>
            <div className="mt-auto flex flex-col gap-2 pt-4">
              {nextScheduledLesson.meetingUrl ? (
                <a
                  href={nextScheduledLesson.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[1rem] bg-[#ffd229] px-4 text-sm font-black text-[#17233f] shadow-[0_10px_24px_rgba(255,210,41,0.22)] hover:bg-[#ffe174]"
                >
                  <Link2 className="h-4 w-4" />
                  Подключиться
                </a>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-4 flex h-full flex-col rounded-[1.15rem] border border-dashed border-[#f2dfb5] bg-white px-4 py-4">
            <p className="text-sm leading-6 text-[#6d7fa3]">Пока уроки не назначены.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function StudentDashboardSummaryStatsSection({
  summaryStats
}: {
  summaryStats: StudentDashboardCoreData["summaryStats"];
}) {
  const items = summaryStats.length > 0
      ? summaryStats
      : [
          { label: "Онлайн-уроки", value: "—", chip: "за 7 дней", icon: "book" as const, href: "/schedule" },
          { label: "Сделано тестов", value: "—", chip: "за 7 дней", icon: "clipboardCheck" as const, href: "/practice" },
          { label: "Слов в повторении", value: "—", chip: "карточки", icon: "brain" as const, href: "/words/review" }
        ];

  return (
    <section className="grid gap-4 xl:grid-cols-[1.12fr_1.04fr_0.82fr]">
      {items.map((item) => (
        <SummaryCard
          key={item.label}
          label={item.label}
          value={item.value}
          chip={item.chip}
          icon={
            item.icon === "sparkles" ? (
              <Sparkles className="h-4 w-4" />
            ) : item.icon === "book" ? (
              <BookOpen className="h-4 w-4" />
            ) : item.icon === "clipboardCheck" ? (
              <ClipboardCheck className="h-4 w-4" />
            ) : (
              <Brain className="h-4 w-4" />
            )
          }
          href={item.href}
        />
      ))}
    </section>
  );
}

function HeroInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[1rem] px-1 py-1.5">
      <p className="text-sm text-[#66789e]">{label}</p>
      <p className="text-xl font-black tracking-[-0.04em] text-[#12203b]">{value}</p>
    </div>
  );
}

function MetaPill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/12 px-3.5 py-2 text-sm font-bold text-[#eef7ff] backdrop-blur-sm">
      {icon}
      {text}
    </span>
  );
}

function StatusBadge({
  children,
  tone
}: {
  children: React.ReactNode;
  tone: DashboardBadgeTone;
}) {
  const className =
    tone === "primary"
      ? "bg-[#eaf4ff] text-[#1f7aff]"
      : tone === "warning"
        ? "bg-[#fff4df] text-[#bc7500]"
        : "bg-[#f3f6fc] text-[#60708e]";

  return <span className={`inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-black ${className}`}>{children}</span>;
}

function SummaryCard({
  label,
  value,
  chip,
  icon,
  href
}: {
  label: string;
  value: string;
  chip: string;
  icon: React.ReactNode;
  href?: string;
}) {
  const router = useRouter();
  const card = (
    <Card className={`rounded-[1.45rem] border-[#dfe9fb] bg-white shadow-none ${href ? "transition group-hover:border-[#b9d2ff] group-hover:shadow-[0_16px_40px_rgba(31,122,255,0.12)]" : ""}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f0f6ff] text-[#2458e6]">
              {icon}
            </span>
            <p className="text-sm text-[#6d7fa3]">{label}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe9fb] bg-[#f5f9ff] px-3 py-1.5 text-sm font-bold text-[#5b6990]">
            {chip}
          </span>
        </div>
        <p className="mt-3 text-5xl font-black leading-none tracking-[-0.05em] text-[#12203b]">{value}</p>
      </CardContent>
    </Card>
  );

  if (!href) return card;

  return (
    <button
      type="button"
      className="group block w-full rounded-[1.45rem] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f7aff]"
      onClick={() => router.push(href)}
    >
      {card}
    </button>
  );
}
