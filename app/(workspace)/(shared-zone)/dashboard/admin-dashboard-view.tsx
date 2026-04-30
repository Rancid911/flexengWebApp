"use client";

import { Banknote, CircleDollarSign, LayoutDashboard, GraduationCap, Receipt, UserCheck } from "lucide-react";
import { useMemo } from "react";

import { AdminSectionHero } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-section-hero";
import { useAdminDashboardMetrics } from "@/app/(workspace)/(shared-zone)/dashboard/use-admin-dashboard-metrics";
import { Card, CardContent } from "@/components/ui/card";
import { StatusMessage } from "@/components/ui/status-message";
import { cn } from "@/lib/utils";

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: currency || "RUB",
      maximumFractionDigits: 0
    }).format(value);
  } catch {
    return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
  }
}

function formatInt(value: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value);
}

type MetricCardConfig = {
  id: string;
  label: string;
  value: string;
  period: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: {
    rail: string;
    chip: string;
    tint: string;
    label: string;
  };
};

function MetricCardSkeleton({ index }: { index: number }) {
  return (
    <div
      key={`admin-metric-skeleton-${index}`}
      className="relative overflow-hidden rounded-2xl border border-[#DCE2EE] bg-[linear-gradient(160deg,#F8FAFD_0%,#F1F5FB_100%)] shadow-[0_8px_20px_rgba(15,23,42,0.05)]"
    >
      <span className="absolute left-0 right-0 top-0 h-1.5 bg-[#E7ECF5]" />
      <div className="space-y-3 p-5 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="h-4 w-32 animate-pulse rounded bg-[#DEE5F0]" />
          <div className="h-9 w-9 animate-pulse rounded-xl bg-[#E3E9F3]" />
        </div>
        <div className="h-10 w-40 animate-pulse rounded-md bg-[#D8E0EC]" />
        <div className="h-3 w-24 animate-pulse rounded bg-[#E1E7F1]" />
      </div>
    </div>
  );
}

export default function AdminDashboardView() {
  const { metrics, hasData, loading, error } = useAdminDashboardMetrics();

  const cards = useMemo<MetricCardConfig[]>(
    () => [
      {
        id: "revenue_month",
        label: "Выручка за месяц",
        value: formatMoney(metrics.revenue_month, metrics.currency),
        period: "Текущий месяц",
        icon: CircleDollarSign,
        accent: {
          rail: "bg-[#654ED6]",
          chip: "bg-[#EFEBFF] text-[#4A3DB5]",
          tint: "from-[#F6F2FF] to-white",
          label: "text-[#4A3DB5]"
        }
      },
      {
        id: "new_payments_7d",
        label: "Новые оплаты",
        value: formatInt(metrics.new_payments_7d),
        period: "Последние 7 дней",
        icon: Receipt,
        accent: {
          rail: "bg-[#2563EB]",
          chip: "bg-[#EAF2FF] text-[#1D4ED8]",
          tint: "from-[#EEF4FF] to-white",
          label: "text-[#1D4ED8]"
        }
      },
      {
        id: "active_students_7d",
        label: "Активные ученики",
        value: formatInt(metrics.active_students_7d),
        period: "Последние 7 дней",
        icon: GraduationCap,
        accent: {
          rail: "bg-[#16A34A]",
          chip: "bg-[#EAFBF1] text-[#15803D]",
          tint: "from-[#F1FDF6] to-white",
          label: "text-[#15803D]"
        }
      },
      {
        id: "active_teachers_7d",
        label: "Активные преподаватели",
        value: formatInt(metrics.active_teachers_7d),
        period: "Последние 7 дней",
        icon: UserCheck,
        accent: {
          rail: "bg-[#0891B2]",
          chip: "bg-[#E9FAFF] text-[#0E7490]",
          tint: "from-[#F0FCFF] to-white",
          label: "text-[#0E7490]"
        }
      },
      {
        id: "avg_check_month",
        label: "Средний чек",
        value: formatMoney(metrics.avg_check_month, metrics.currency),
        period: "Текущий месяц",
        icon: Banknote,
        accent: {
          rail: "bg-[#F97316]",
          chip: "bg-[#FFF1E8] text-[#C2410C]",
          tint: "from-[#FFF7F1] to-white",
          label: "text-[#C2410C]"
        }
      }
    ],
    [metrics]
  );

  return (
    <div className="space-y-5 pb-8">
      <AdminSectionHero
        badgeIcon={LayoutDashboard}
        badgeLabel="Дашборд"
        title="Ключевые показатели школы"
        description="Следите за выручкой, оплатами и активностью учеников и преподавателей в одном сводном разделе."
        metricsSlot={
          <div className="rounded-[1.4rem] border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-white/70">Фокус периода</p>
            <p className="mt-1 text-sm text-white/85">Выручка за текущий месяц</p>
            <p className="mt-2 text-2xl font-black tabular-nums">{formatMoney(metrics.revenue_month, metrics.currency)}</p>
          </div>
        }
      />

      {error ? <StatusMessage className="inline-flex max-w-full items-center rounded-full bg-[#FFF1F1] text-[#B42318]">{error}</StatusMessage> : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading && !hasData
          ? Array.from({ length: 6 }).map((_, index) => <MetricCardSkeleton key={`admin-metric-skeleton-${index}`} index={index} />)
          : (
              <>
                {cards.map((card) => (
                    <Card
                      key={card.id}
                      className={cn(
                      "group relative overflow-hidden rounded-2xl border-[#DCE2EE] bg-[linear-gradient(160deg,var(--tw-gradient-stops))] shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition-[transform,box-shadow,border-color,background-color] duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_30px_rgba(15,23,42,0.12)]",
                      card.accent.tint
                    )}
                  >
                    <span className={cn("absolute left-0 right-0 top-0 h-1.5", card.accent.rail)} />
                    <CardContent className="space-y-3 p-5 pt-6">
                      <div className="flex items-start justify-between gap-3">
                        <p className={cn("text-sm font-semibold", card.accent.label)}>{card.label}</p>
                        <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl", card.accent.chip)}>
                          <card.icon className="h-5 w-5" />
                        </span>
                      </div>
                      <p className="text-3xl font-black tracking-tight text-slate-900 tabular-nums">{card.value}</p>
                      <p className="text-xs font-medium text-slate-500">{card.period}</p>
                    </CardContent>
                  </Card>
                ))}
                <Card className="rounded-2xl border-2 border-dashed border-[#C9CFDD] bg-[linear-gradient(160deg,#F8FAFD_0%,#F2F5FA_100%)] shadow-none">
                  <CardContent className="flex h-full min-h-36 flex-col items-center justify-center gap-2 p-5 text-center">
                    <p className="text-sm font-semibold text-slate-600">Добавить KPI</p>
                    <p className="text-xs text-slate-500">Слот под следующую бизнес-метрику</p>
                  </CardContent>
                </Card>
              </>
            )}
      </section>
    </div>
  );
}
