"use client";

import { CalendarClock } from "lucide-react";

import { MetricCard } from "@/app/(workspace)/(shared-zone)/schedule/schedule-components";

export function StaffScheduleHero({ lessonCount, scheduledCount }: { lessonCount: number; scheduledCount: number }) {
  return (
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
          <MetricCard label="Всего в ленте" value={String(lessonCount)} />
          <MetricCard label="Активных уроков" value={String(scheduledCount)} />
        </div>
      </div>
    </section>
  );
}
