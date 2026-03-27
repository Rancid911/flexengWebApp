"use client";

import {
  ArrowRight,
  Brain,
  BookOpen,
  CalendarClock,
  CalendarCheck2,
  Clock3,
  Layers,
  Link2,
  Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { StudentDashboardData } from "@/lib/dashboard/student-dashboard";
import { formatScheduleDateLabel } from "@/lib/schedule/utils";

type DashboardBadgeTone = "primary" | "warning" | "muted";

export default function StudentDashboardView({ data }: { data: StudentDashboardData }) {
  const router = useRouter();
  const { lessonOfTheDay, progress, heroStats, homeworkCards, recommendationCards, summaryStats, nextScheduledLesson } = data;

  return (
    <div className="space-y-5 pb-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#dfe9fb] bg-[linear-gradient(135deg,#6658f5_0%,#8b74ff_56%,#9f81ff_100%)] text-white shadow-[0_18px_44px_rgba(89,71,236,0.2)]">
        <div aria-hidden className="pointer-events-none absolute right-[-30px] top-[-40px] h-[220px] w-[220px] rounded-full bg-white/20" />
        <div aria-hidden className="pointer-events-none absolute bottom-[-55px] right-[120px] h-[140px] w-[140px] rounded-full bg-white/20 max-sm:right-[40px]" />
        <div className="grid gap-5 p-6 md:grid-cols-[1.35fr_0.95fr] md:p-7">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#fff1b8] px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em] text-[#8a6400]">
              <BookOpen className="h-3.5 w-3.5" />
              Урок дня
            </span>
            <div className="space-y-3">
              <h1 className="text-4xl font-black tracking-[-0.06em] text-white sm:text-5xl">{lessonOfTheDay.title}</h1>
              <p className="max-w-2xl text-sm leading-6 text-[#ecf6ff] sm:text-base">{lessonOfTheDay.description}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <MetaPill icon={<Clock3 className="h-4 w-4" />} text={lessonOfTheDay.duration} />
              <MetaPill icon={<CalendarCheck2 className="h-4 w-4" />} text={`${lessonOfTheDay.progress}% пройдено`} />
              <MetaPill icon={<Layers className="h-4 w-4" />} text={`${lessonOfTheDay.sectionsCount} разделов в курсе`} />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                className="h-12 rounded-[1.15rem] bg-[#ffd84d] px-5 font-black text-[#6b5000] shadow-[0_14px_26px_rgba(255,216,77,0.28)] hover:bg-[#ffe78f]"
                onClick={() => router.push("/learning")}
              >
                Продолжить
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-[1.15rem] border-white/35 bg-transparent px-5 font-black text-white hover:border-white/45 hover:bg-white/10 hover:text-white"
                onClick={() => router.push("/tests")}
              >
                Открыть практику
              </Button>
            </div>
          </div>

          <Card className="border-white/20 bg-white/12 text-white shadow-none backdrop-blur-sm">
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div>
                <p className="text-sm font-semibold text-[#e7f4ff]">Прогресс по теме</p>
                <p className="mt-2 text-5xl font-black tracking-[-0.06em]">{progress.value}%</p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/20">
                  <span
                    className="block h-full rounded-full bg-white transition-[width] duration-500"
                    style={{ width: `${Math.max(0, Math.min(progress.value, 100))}%` }}
                  />
                </div>
                <p className="mt-3 text-sm text-[#e7f4ff]">{progress.label}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {heroStats.map((item) => (
                  <HeroInfoCard key={item.label} label={item.label} value={item.value} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-[2fr_2fr_1.08fr]">
        <Card className="rounded-[2rem] border-[#dfe9fb] bg-white shadow-[0_18px_44px_rgba(27,73,155,0.1)]">
          <CardContent className="space-y-4 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black tracking-[-0.03em] text-[#12203b]">Домашние задания</h2>
              <StatusBadge tone="warning">{`${homeworkCards.length} активных`}</StatusBadge>
            </div>
            <div className="space-y-3">
              {homeworkCards.length > 0 ? (
                homeworkCards.map((item, index) => (
                  <button
                    key={`${item.id}-${index}`}
                    type="button"
                    onClick={() => router.push("/homework")}
                    className="flex w-full items-center justify-between gap-4 rounded-[1.35rem] border border-[#dfe9fb] bg-white px-4 py-4 text-left transition hover:bg-[#fafdff]"
                  >
                    <div>
                      <p className="font-black text-[#12203b]">{item.title}</p>
                      <p className="mt-1 text-sm text-[#6d7fa3]">{item.subtitle}</p>
                    </div>
                    <StatusBadge tone={item.statusTone}>{item.status}</StatusBadge>
                  </button>
                ))
              ) : (
                <div className="rounded-[1.35rem] border border-dashed border-[#dfe9fb] bg-[#f8fbff] px-4 py-5 text-sm text-[#6d7fa3]">
                  Активных домашних заданий пока нет.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-[#dfe9fb] bg-white shadow-[0_18px_44px_rgba(27,73,155,0.1)]">
          <CardContent className="space-y-4 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black tracking-[-0.03em] text-[#12203b]">Рекомендовано</h2>
              <StatusBadge tone="primary">Для вас</StatusBadge>
            </div>
            <div className="space-y-3">
              {recommendationCards.length > 0 ? (
                recommendationCards.map((item, index) => (
                  <button
                    key={`${item.id}-${index}`}
                    type="button"
                    onClick={() => router.push("/practice/recommended")}
                    className="flex w-full items-center justify-between gap-4 rounded-[1.35rem] border border-[#dfe9fb] bg-white px-4 py-4 text-left transition hover:bg-[#fafdff]"
                  >
                    <div>
                      <p className="font-black text-[#12203b]">{item.title}</p>
                      <p className="mt-1 text-sm text-[#6d7fa3]">{item.subtitle}</p>
                    </div>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#dfe9fb] bg-[#f5f9ff] text-[#587198]">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </button>
                ))
              ) : (
                <div className="rounded-[1.35rem] border border-dashed border-[#dfe9fb] bg-[#f8fbff] px-4 py-5 text-sm text-[#6d7fa3]">
                  Рекомендации появятся после первых попыток и прогресса по практикам.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-[#dfe9fb] bg-[linear-gradient(180deg,#f7fbff_0%,#ffffff_100%)] shadow-[0_18px_44px_rgba(27,73,155,0.08)] lg:col-span-2 xl:col-span-1">
          <CardContent className="flex h-full flex-col p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black tracking-[-0.03em] text-[#12203b]">Ближайшие уроки</h2>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#eaf4ff] text-[#1f7aff]">
                <CalendarClock className="h-4 w-4" />
              </span>
            </div>

            {nextScheduledLesson ? (
              <div className="mt-4 flex h-full flex-col">
                <h3 className="text-lg font-black leading-tight tracking-[-0.04em] text-[#12203b]">{nextScheduledLesson.title}</h3>
                <div className="mt-3 space-y-1.5 text-sm text-[#587198]">
                  <p>{formatScheduleDateLabel(nextScheduledLesson.startsAt)}</p>
                  <p>Учитель: {nextScheduledLesson.teacherName}</p>
                </div>
                <div className="mt-auto flex flex-col gap-2 pt-4">
                  {nextScheduledLesson.meetingUrl ? (
                    <a
                      href={nextScheduledLesson.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-[1.15rem] bg-[#1f7aff] px-4 text-sm font-black text-white shadow-[0_10px_24px_rgba(31,122,255,0.18)] hover:bg-[#1669db]"
                    >
                      <Link2 className="h-4 w-4" />
                      Подключиться
                    </a>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="mt-4 flex h-full flex-col">
                <p className="text-sm leading-6 text-[#6d7fa3]">Пока уроки не назначены.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        {summaryStats.map((item) => (
          <SummaryCard
            key={item.label}
            label={item.label}
            value={item.value}
            chip={item.chip}
            icon={item.icon === "sparkles" ? <Sparkles className="h-4 w-4" /> : item.icon === "book" ? <BookOpen className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
          />
        ))}
      </section>
    </div>
  );
}

function HeroInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-white/20 bg-white/12 px-4 py-3">
      <p className="text-sm text-[#e7f4ff]">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">{value}</p>
    </div>
  );
}

function MetaPill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3.5 py-2 text-sm font-bold text-[#eef7ff]">
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

  return <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-black ${className}`}>{children}</span>;
}

function SummaryCard({
  label,
  value,
  chip,
  icon
}: {
  label: string;
  value: string;
  chip: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="rounded-[1.8rem] border-[#dfe9fb] bg-white shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-[#6d7fa3]">{label}</p>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe9fb] bg-[#f5f9ff] px-3 py-1.5 text-sm font-bold text-[#5b6990]">
            {icon}
            {chip}
          </span>
        </div>
        <p className="mt-2 text-5xl font-black leading-none tracking-[-0.05em] text-[#12203b]">{value}</p>
      </CardContent>
    </Card>
  );
}
