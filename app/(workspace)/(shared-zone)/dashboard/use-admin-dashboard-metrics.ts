"use client";

import { useEffect, useState } from "react";

import { useAbortableRequest } from "@/hooks/use-abortable-request";
import type { AdminDashboardMetricsDto } from "@/lib/admin/types";
import { readRuntimeCache, writeRuntimeCache } from "@/lib/session-runtime-cache";
import { mapUiErrorMessage } from "@/lib/ui-error-map";

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

export function getAdminDashboardHydrationSafeInitialState() {
  return {
    metrics: defaultMetrics,
    hasData: false,
    loading: true,
    error: ""
  };
}

function normalizeSnapshot(raw: unknown): AdminDashboardSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const maybe = raw as Partial<AdminDashboardSnapshot>;
  if (typeof maybe.cachedAt !== "number" || !maybe.metrics || typeof maybe.metrics !== "object") return null;
  if (Date.now() - maybe.cachedAt > ADMIN_DASHBOARD_TTL_MS) return null;
  return maybe as AdminDashboardSnapshot;
}

function normalizeMetrics(payload: AdminDashboardMetricsDto): AdminDashboardMetricsDto {
  return {
    revenue_month: Number(payload.revenue_month ?? 0),
    new_payments_7d: Number(payload.new_payments_7d ?? 0),
    active_students_7d: Number(payload.active_students_7d ?? 0),
    active_teachers_7d: Number(payload.active_teachers_7d ?? 0),
    avg_check_month: Number(payload.avg_check_month ?? 0),
    currency: payload.currency || "RUB"
  };
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

export function useAdminDashboardMetrics() {
  const initialState = getAdminDashboardHydrationSafeInitialState();
  const [metrics, setMetrics] = useState<AdminDashboardMetricsDto>(initialState.metrics);
  const [hasData, setHasData] = useState(initialState.hasData);
  const [loading, setLoading] = useState(initialState.loading);
  const [error, setError] = useState(initialState.error);
  const { run: runMetricsRequest } = useAbortableRequest();

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const runtimeSnapshot = normalizeSnapshot(readRuntimeCache<AdminDashboardSnapshot>(ADMIN_DASHBOARD_RUNTIME_KEY, ADMIN_DASHBOARD_TTL_MS));
      const cachedSnapshot = runtimeSnapshot ?? readSessionSnapshot();
      if (!cachedSnapshot) return;
      setMetrics(cachedSnapshot.metrics);
      setHasData(true);
      setLoading(false);
      writeRuntimeCache(ADMIN_DASHBOARD_RUNTIME_KEY, cachedSnapshot);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const runtimeSnapshot = normalizeSnapshot(readRuntimeCache<AdminDashboardSnapshot>(ADMIN_DASHBOARD_RUNTIME_KEY, ADMIN_DASHBOARD_TTL_MS));
    const cachedSnapshot = runtimeSnapshot ?? readSessionSnapshot();
    if (cachedSnapshot) {
      return;
    }

    void runMetricsRequest({
      onStart: () => {
        setLoading(true);
      },
      onSuccess: (nextMetrics: AdminDashboardMetricsDto) => {
        setMetrics(nextMetrics);
        setHasData(true);
        setError("");
        setLoading(false);

        const snapshot: AdminDashboardSnapshot = {
          cachedAt: Date.now(),
          metrics: nextMetrics
        };
        writeRuntimeCache(ADMIN_DASHBOARD_RUNTIME_KEY, snapshot);
        writeSessionSnapshot(snapshot);
      },
      onError: (loadError) => {
        if ((loadError as Error).name === "AbortError") return;
        setError(mapUiErrorMessage(loadError instanceof Error ? loadError.message : "", "Не удалось загрузить метрики дашборда."));
        setLoading(false);
      },
      request: async (signal) => {
        const response = await fetch("/api/admin/dashboard/metrics", {
          cache: "no-store",
          signal
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

        return normalizeMetrics((await response.json()) as AdminDashboardMetricsDto);
      }
    });
  }, [runMetricsRequest]);

  return {
    metrics,
    hasData,
    loading,
    error
  };
}
