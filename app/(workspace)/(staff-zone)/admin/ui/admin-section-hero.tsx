"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type AdminSectionHeroProps = {
  badgeIcon: LucideIcon;
  badgeLabel: string;
  title: string;
  description: string;
  actionsSlot?: ReactNode;
  metricsSlot?: ReactNode;
};

export function AdminSectionHero({
  badgeIcon: BadgeIcon,
  badgeLabel,
  title,
  description,
  actionsSlot,
  metricsSlot
}: AdminSectionHeroProps) {
  return (
    <section className="rounded-[2rem] border border-[#dfe9fb] bg-[linear-gradient(135deg,#0f172a_0%,#1f3d7a_55%,#2563eb_100%)] p-6 text-white shadow-[0_20px_44px_rgba(15,23,42,0.18)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white/90">
            <BadgeIcon className="h-3.5 w-3.5" />
            {badgeLabel}
          </span>
          <div>
            <h1 className="text-3xl font-black tracking-[-0.05em] sm:text-4xl">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-[#dbeafe] sm:text-base">{description}</p>
          </div>
        </div>

        {actionsSlot || metricsSlot ? (
          <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[220px] lg:max-w-xs lg:items-stretch">
            {metricsSlot}
            {actionsSlot}
          </div>
        ) : null}
      </div>
    </section>
  );
}
