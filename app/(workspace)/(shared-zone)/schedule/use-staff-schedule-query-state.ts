"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useCallback, useEffect, useMemo, useState, useTransition, type SetStateAction } from "react";

import type { StaffSchedulePageData } from "@/lib/schedule/types";
import { groupLessonsByDate } from "@/lib/schedule/utils";
import { scheduleFiltersSchema } from "@/lib/schedule/validation";

type UseStaffScheduleQueryStateParams = {
  initialData: StaffSchedulePageData;
};

function buildScheduleSearchParams(filters: StaffSchedulePageData["filters"], teacherLocked: boolean) {
  const params = new URLSearchParams();

  if (filters.studentId) params.set("studentId", filters.studentId);
  if (!teacherLocked && filters.teacherId) params.set("teacherId", filters.teacherId);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);

  return params;
}

function readFiltersFromSearchParams(searchParams: URLSearchParams, fallback: StaffSchedulePageData["filters"], teacherLocked: boolean) {
  const parsed = scheduleFiltersSchema.safeParse({
    studentId: searchParams.get("studentId"),
    teacherId: searchParams.get("teacherId"),
    status: searchParams.get("status"),
    dateFrom: searchParams.get("dateFrom"),
    dateTo: searchParams.get("dateTo")
  });

  if (!parsed.success) {
    return fallback;
  }

  return {
    studentId: parsed.data.studentId ?? "",
    teacherId: teacherLocked ? fallback.teacherId : (parsed.data.teacherId ?? ""),
    status: parsed.data.status ?? "all",
    dateFrom: parsed.data.dateFrom ?? "",
    dateTo: parsed.data.dateTo ?? ""
  } satisfies StaffSchedulePageData["filters"];
}

export async function parseScheduleApiResponse<T>(response: Response): Promise<T> {
  if (response.ok) return response.json() as Promise<T>;
  const payload = (await response.json().catch(() => null)) as
    | {
        message?: string;
        details?: {
          fieldErrors?: Record<string, string[] | undefined>;
          formErrors?: string[];
        };
      }
    | null;

  const fieldErrorMessage = payload?.details?.fieldErrors
    ? Object.values(payload.details.fieldErrors)
        .flat()
        .find((value): value is string => typeof value === "string" && value.length > 0)
    : null;
  const formErrorMessage = payload?.details?.formErrors?.find((value): value is string => typeof value === "string" && value.length > 0) ?? null;

  throw new Error(fieldErrorMessage || formErrorMessage || payload?.message || "Не удалось выполнить запрос");
}

export function useStaffScheduleQueryState({ initialData }: UseStaffScheduleQueryStateParams) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startNavigationTransition] = useTransition();
  const lessonStateKey = useMemo(
    () => JSON.stringify({ filters: initialData.filters, teacherLocked: initialData.teacherLocked }),
    [initialData.filters, initialData.teacherLocked]
  );
  const [enrichedLessonsState, setEnrichedLessonsState] = useState<{ key: string; lessons: StaffSchedulePageData["lessons"] } | null>(null);

  const filters = useMemo(
    () => readFiltersFromSearchParams(new URLSearchParams(searchParams.toString()), initialData.filters, initialData.teacherLocked),
    [initialData.filters, initialData.teacherLocked, searchParams]
  );

  const setFilters = useCallback(
    (value: SetStateAction<StaffSchedulePageData["filters"]>) => {
      const nextFilters = typeof value === "function" ? value(filters) : value;
      const currentUrl = buildScheduleSearchParams(filters, initialData.teacherLocked).toString();
      const nextUrlSearch = buildScheduleSearchParams(nextFilters, initialData.teacherLocked).toString();
      if (nextUrlSearch === currentUrl) {
        return;
      }

      const nextUrl = nextUrlSearch ? `${pathname}?${nextUrlSearch}` : pathname;

      startNavigationTransition(() => {
        router.replace(nextUrl, { scroll: false });
      });
    },
    [filters, initialData.teacherLocked, pathname, router]
  );

  const refreshLessons = useCallback(async () => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  useEffect(() => {
    if (initialData.lessons.length === 0) return;

    let cancelled = false;
    const params = buildScheduleSearchParams(initialData.filters, initialData.teacherLocked);
    params.set("includeFollowup", "1");

    void (async () => {
      try {
        const response = await fetch(`/api/schedule?${params.toString()}`, { cache: "no-store" });
        const payload = await parseScheduleApiResponse<StaffSchedulePageData>(response);
        if (cancelled) return;
        setEnrichedLessonsState({
          key: lessonStateKey,
          lessons: Array.isArray(payload.lessons) ? payload.lessons : initialData.lessons
        });
      } catch {
        // Keep the initial lesson list visible if deferred follow-up enrichment fails.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialData.filters, initialData.lessons, initialData.teacherLocked, initialData.lessons.length, lessonStateKey]);

  const lessons = enrichedLessonsState?.key === lessonStateKey ? enrichedLessonsState.lessons : initialData.lessons;

  const groupedLessons = useMemo(() => groupLessonsByDate(lessons), [lessons]);
  const scheduledCount = useMemo(() => lessons.filter((lesson) => lesson.status === "scheduled").length, [lessons]);

  return {
    filters,
    groupedLessons,
    isLoading: isPending,
    lessons,
    refreshLessons,
    scheduledCount,
    setFilters
  };
}
