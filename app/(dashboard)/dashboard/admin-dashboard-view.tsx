"use client";

import { Banknote, CircleDollarSign, GraduationCap, Receipt, UserCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import type { AdminDashboardMetricsDto } from "@/lib/admin/types";
import { readRuntimeCache, writeRuntimeCache } from "@/lib/session-runtime-cache";
import { mapUiErrorMessage } from "@/lib/ui-error-map";
import { cn } from "@/lib/utils";

const ADMIN_DASHBOARD_RUNTIME_KEY = "admin-dashboard-metrics:v1";
const ADMIN_DASHBOARD_SESSION_KEY = "admin-dashboard-metrics:session:v1";
const ADMIN_DASHBOARD_TTL_MS = 5 * 60 * 1000;

type AdminDashboardSnapshot = {
  cachedAt: number;
  metrics: AdminDashboardMetricsDto;
};

const defaultMetrics: AdminDashboardMetricsDto = {
  revenue_month: 0,
  new_payments_7d: 0,
  active_students_7d: 0,
  active_teachers_7d: 0,
  avg_check_month: 0,
  currency: "RUB"
};

function normalizeSnapshot(raw: unknown): AdminDashboardSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const maybe = raw as Partial<AdminDashboardSnapshot>;
  if (typeof maybe.cachedAt !== "number" || !maybe.metrics || typeof maybe.metrics !== "object") return null;
  if (Date.now() - maybe.cachedAt > ADMIN_DASHBOARD_TTL_MS) return null;
  return maybe as AdminDashboardSnapshot;
}

function readSessionSnapshot(): AdminDashboardSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(ADMIN_DASHBOARD_SESSION_KEY);
    if (!raw) return null;
    return normalizeSnapshot(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeSessionSnapshot(snapshot: AdminDashboardSnapshot) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(ADMIN_DASHBOARD_SESSION_KEY, JSON.stringify(snapshot));
  } catch {
    // no-op
  }
}

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
  const runtimeSnapshot = normalizeSnapshot(readRuntimeCache<AdminDashboardSnapshot>(ADMIN_DASHBOARD_RUNTIME_KEY, ADMIN_DASHBOARD_TTL_MS));
  const [metrics, setMetrics] = useState<AdminDashboardMetricsDto>(runtimeSnapshot?.metrics ?? defaultMetrics);
  const [hasData, setHasData] = useState(Boolean(runtimeSnapshot));
  const [loading, setLoading] = useState(!runtimeSnapshot);
  const [error, setError] = useState("");

  useEffect(() => {
    if (runtimeSnapshot) return;
    const sessionSnapshot = readSessionSnapshot();
    if (!sessionSnapshot) return;
    setMetrics(sessionSnapshot.metrics);
    setHasData(true);
    setLoading(false);
    writeRuntimeCache(ADMIN_DASHBOARD_RUNTIME_KEY, sessionSnapshot);
  }, [runtimeSnapshot]);

  useEffect(() => {
    const controller = new AbortController();
    let isAlive = true;

    async function load() {
      try {
        const response = await fetch("/api/admin/dashboard/metrics", {
          cache: "no-store",
          signal: controller.signal
        });
        if (!response.ok) {
          let fallback = `Не удалось загрузить метрики (код ${response.status}).`;
          try {
            const payload = await response.json();
            if (payload && typeof payload.message === "string" && payload.message.trim().length > 0) {
              fallback = payload.message;
            }
          } catch {
            // no-op
          }
          throw new Error(fallback);
        }
        const payload = (await response.json()) as AdminDashboardMetricsDto;
        if (!isAlive) return;
        setMetrics({
          revenue_month: Number(payload.revenue_month ?? 0),
          new_payments_7d: Number(payload.new_payments_7d ?? 0),
          active_students_7d: Number(payload.active_students_7d ?? 0),
          active_teachers_7d: Number(payload.active_teachers_7d ?? 0),
          avg_check_month: Number(payload.avg_check_month ?? 0),
          currency: payload.currency || "RUB"
        });
        setHasData(true);
        setError("");

        const snapshot: AdminDashboardSnapshot = {
          cachedAt: Date.now(),
          metrics: {
            revenue_month: Number(payload.revenue_month ?? 0),
            new_payments_7d: Number(payload.new_payments_7d ?? 0),
            active_students_7d: Number(payload.active_students_7d ?? 0),
            active_teachers_7d: Number(payload.active_teachers_7d ?? 0),
            avg_check_month: Number(payload.avg_check_month ?? 0),
            currency: payload.currency || "RUB"
          }
        };
        writeRuntimeCache(ADMIN_DASHBOARD_RUNTIME_KEY, snapshot);
        writeSessionSnapshot(snapshot);
      } catch (loadError) {
        if (!isAlive) return;
        if ((loadError as Error).name === "AbortError") return;
        setError(mapUiErrorMessage(loadError instanceof Error ? loadError.message : "", "Не удалось загрузить метрики дашборда."));
      } finally {
        if (isAlive) setLoading(false);
      }
    }

    void load();
    return () => {
      isAlive = false;
      controller.abort();
    };
  }, []);

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
      <section className="relative overflow-hidden rounded-3xl border border-[#6D63A6] bg-[linear-gradient(135deg,#332B57_0%,#3F3670_42%,#2E4C8A_72%,#6850A8_100%)] p-6 text-white shadow-[0_22px_48px_rgba(39,27,82,0.34)] sm:p-7">
        <div className="pointer-events-none absolute -left-12 -top-16 h-56 w-56 rounded-full bg-[#8D70FF]/35 blur-3xl" />
        <div className="pointer-events-none absolute -right-12 -bottom-20 h-64 w-64 rounded-full bg-[#F76D63]/30 blur-3xl" />
        <div className="pointer-events-none absolute right-[30%] top-8 h-40 w-40 rounded-full bg-[#60A5FA]/25 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-col gap-0">
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Флексенг</h1>
              <p className="-mt-1 text-sm font-semibold leading-tight text-white/85 sm:text-base">онлайн-школа английского языка</p>
            </div>
          </div>

          <div className="w-full max-w-xs rounded-2xl border border-white/25 bg-white/12 p-4 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wide text-white/70">Фокус периода</p>
            <p className="mt-1 text-sm text-white/85">Выручка за текущий месяц</p>
            <p className="mt-2 text-2xl font-black tabular-nums">{formatMoney(metrics.revenue_month, metrics.currency)}</p>
          </div>
        </div>
      </section>

      {error ? (
        <div className="inline-flex max-w-full items-center rounded-full border border-[#FBC3C3] bg-[#FFF1F1] px-4 py-2 text-sm text-[#B42318]">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading && !hasData
          ? Array.from({ length: 6 }).map((_, index) => <MetricCardSkeleton key={`admin-metric-skeleton-${index}`} index={index} />)
          : (
              <>
                {cards.map((card) => (
                  <Card
                    key={card.id}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border-[#DCE2EE] bg-[linear-gradient(160deg,var(--tw-gradient-stops))] shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_30px_rgba(15,23,42,0.12)]",
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
