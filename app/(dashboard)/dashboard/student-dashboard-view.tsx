"use client";

import {
  ArrowRight,
  BookOpen,
  CalendarCheck2,
  Clock3,
  Eye,
  Layers,
  Trophy,
  Users
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  HomeCacheData,
  ProfileCacheData,
  homeCacheKey,
  profileCacheKey,
  readDashboardCache,
  writeDashboardCache
} from "@/lib/dashboard-cache";
import { readRuntimeCache, writeRuntimeCache } from "@/lib/session-runtime-cache";
import { runAuthRequestWithLockRetry } from "@/lib/supabase/auth-request";
import { createClient } from "@/lib/supabase/client";

type DashboardModule = {
  id: string;
  title: string;
  description: string;
  courseTitle: string;
};

type DashboardRuntimeSnapshot = {
  displayName: string;
  modulesData: DashboardModule[];
  progressValue: number;
  progressText: string;
  lastResultText: string;
  quickStats: { tests: string; streak: string; learningTime: string };
  hasHomeData: boolean;
};

const moduleLoadingCards = [{ id: "loading-basics" }, { id: "loading-daily-life" }];
const progressRadius = 46;
const progressCircleLength = 2 * Math.PI * progressRadius;
const DASHBOARD_RUNTIME_KEY = "student-dashboard:v1";

export default function DashboardPage() {
  const router = useRouter();
  const snapshot = readRuntimeCache<DashboardRuntimeSnapshot>(DASHBOARD_RUNTIME_KEY);
  const [displayName, setDisplayName] = useState(snapshot?.displayName ?? "");
  const [modulesData, setModulesData] = useState<DashboardModule[]>(snapshot?.modulesData ?? []);
  const [progressValue, setProgressValue] = useState(snapshot?.progressValue ?? 22);
  const [progressText, setProgressText] = useState(snapshot?.progressText ?? "Прогресс пока не рассчитан");
  const [lastResultText, setLastResultText] = useState(snapshot?.lastResultText ?? "Последние результаты пока отсутствуют");
  const [quickStats, setQuickStats] = useState(snapshot?.quickStats ?? { tests: "…", streak: "…", learningTime: "…" });
  const [isInitialLoading, setIsInitialLoading] = useState(!(snapshot?.hasHomeData ?? false));
  const [hasHomeData, setHasHomeData] = useState(snapshot?.hasHomeData ?? false);

  useEffect(() => {
    const supabase = createClient();

    async function loadData() {
      let hasCachedHome = false;
      try {
        const { data: authData, error: authError } = await runAuthRequestWithLockRetry(() => supabase.auth.getUser());
        if (authError) throw authError;
        if (!authData.user) {
          router.replace("/login");
          return;
        }

        const userId = authData.user.id;
        const cachedProfile = readDashboardCache<ProfileCacheData>(profileCacheKey(userId));
        if (cachedProfile?.displayName) {
          setDisplayName(cachedProfile.displayName);
        }

        const cachedHome = readDashboardCache<HomeCacheData>(homeCacheKey(userId));
        if (cachedHome) {
          hasCachedHome = true;
          setModulesData(cachedHome.modulesData);
          setProgressValue(cachedHome.progressValue);
          setProgressText(cachedHome.progressText);
          setLastResultText(cachedHome.lastResultText);
          setQuickStats(cachedHome.quickStats);
          setHasHomeData(true);
          setIsInitialLoading(false);
          writeRuntimeCache<DashboardRuntimeSnapshot>(DASHBOARD_RUNTIME_KEY, {
            displayName: cachedProfile?.displayName ?? "",
            modulesData: cachedHome.modulesData,
            progressValue: cachedHome.progressValue,
            progressText: cachedHome.progressText,
            lastResultText: cachedHome.lastResultText,
            quickStats: cachedHome.quickStats,
            hasHomeData: true
          });
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, display_name, first_name, last_name")
          .eq("id", userId)
          .maybeSingle();
        if (profileError) throw profileError;

        const currentRole = profile?.role ?? "student";
        const nameFromProfile =
          profile?.display_name ||
          [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
          authData.user.email?.split("@")[0] ||
          "";
        setDisplayName(nameFromProfile);

        let studentId: string | null = null;
        let teacherId: string | null = null;
        let roleCourseIds: string[] = [];

        if (currentRole === "student") {
          const { data: studentRow, error: studentError } = await supabase
            .from("students")
            .select("id")
            .eq("profile_id", userId)
            .maybeSingle();
          if (studentError) throw studentError;
          studentId = studentRow?.id ?? null;
          if (studentId) {
            const { data: enrollments, error: enrollmentError } = await supabase
              .from("student_course_enrollments")
              .select("course_id")
              .eq("student_id", studentId)
              .in("status", ["active", "paused"]);
            if (enrollmentError) throw enrollmentError;
            roleCourseIds = (enrollments ?? []).map((x: { course_id: string }) => x.course_id);
          }
        }

        if (currentRole === "teacher") {
          const { data: teacherRow, error: teacherError } = await supabase
            .from("teachers")
            .select("id")
            .eq("profile_id", userId)
            .maybeSingle();
          if (teacherError) throw teacherError;
          teacherId = teacherRow?.id ?? null;
          if (teacherId) {
            const { data: enrollments, error: enrollmentError } = await supabase
              .from("student_course_enrollments")
              .select("course_id")
              .eq("assigned_teacher_id", teacherId)
              .eq("status", "active");
            if (enrollmentError) throw enrollmentError;
            roleCourseIds = (enrollments ?? []).map((x: { course_id: string }) => x.course_id);
          }
        }

        if (currentRole === "admin" || currentRole === "manager") {
          const { data: courseRows, error: courseRowsError } = await supabase
            .from("courses")
            .select("id")
            .eq("is_published", true)
            .limit(50);
          if (courseRowsError) throw courseRowsError;
          roleCourseIds = (courseRows ?? []).map((x: { id: string }) => x.id);
        }

        const uniqueCourseIds = Array.from(new Set(roleCourseIds));
        let modulesRows: Array<{ id: string; title: string; description: string | null; course_id: string; sort_order: number }> = [];

        if (uniqueCourseIds.length > 0) {
          const { data, error: modulesError } = await supabase
            .from("course_modules")
            .select("id, title, description, course_id, sort_order")
            .in("course_id", uniqueCourseIds)
            .eq("is_published", true)
            .order("sort_order");
          if (modulesError) throw modulesError;
          modulesRows = data ?? [];
        } else if (currentRole === "admin" || currentRole === "manager") {
          const { data, error: modulesError } = await supabase
            .from("course_modules")
            .select("id, title, description, course_id, sort_order")
            .eq("is_published", true)
            .order("sort_order")
            .limit(20);
          if (modulesError) throw modulesError;
          modulesRows = data ?? [];
        }

        const courseIdsFromModules = Array.from(new Set(modulesRows.map((module) => module.course_id)));
        const courseTitleMap = new Map<string, string>();
        if (courseIdsFromModules.length > 0) {
          const { data: courseTitles, error: courseTitlesError } = await supabase
            .from("courses")
            .select("id, title")
            .in("id", courseIdsFromModules);
          if (courseTitlesError) throw courseTitlesError;
          (courseTitles ?? []).forEach((course: { id: string; title: string }) => courseTitleMap.set(course.id, course.title));
        }

        const preparedModules = modulesRows.slice(0, 6).map((module) => ({
          id: module.id,
          title: module.title,
          description: module.description ?? "Описание модуля пока не заполнено",
          courseTitle: courseTitleMap.get(module.course_id) ?? "Курс"
        }));
        setModulesData(preparedModules);

        let nextProgressValue = 0;
        let nextProgressText = "Прогресс доступен в профиле ученика";
        let nextLastResultText = "Последний результат теста пока отсутствует";
        let nextQuickStats = {
          tests: "—",
          streak: currentRole === "teacher" ? "Преподаватель" : currentRole,
          learningTime: "—"
        };

        if (studentId) {
          const { data: progressRows, error: progressError } = await supabase
            .from("student_lesson_progress")
            .select("progress_percent")
            .eq("student_id", studentId);
          if (progressError) throw progressError;

          const values = (progressRows ?? []).map((row: { progress_percent: number }) => Number(row.progress_percent || 0));
          const avg = values.length > 0 ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
          nextProgressValue = avg;
          nextProgressText = values.length > 0 ? `Вы завершили ${avg}% обучения` : "Начните первый урок, чтобы увидеть прогресс";

          const { data: latestAttempt, error: latestAttemptError } = await supabase
            .from("student_test_attempts")
            .select("score")
            .eq("student_id", studentId)
            .order("started_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (latestAttemptError) throw latestAttemptError;

          nextLastResultText =
            latestAttempt?.score !== null && latestAttempt?.score !== undefined
              ? `Последний результат теста: ${Math.round(Number(latestAttempt.score))}%`
              : "Последний результат теста пока отсутствует";

          const { count: testCount, error: testCountError } = await supabase
            .from("student_test_attempts")
            .select("id", { count: "exact", head: true })
            .eq("student_id", studentId);
          if (testCountError) throw testCountError;

          const { count: completedCount, error: completedCountError } = await supabase
            .from("student_lesson_progress")
            .select("id", { count: "exact", head: true })
            .eq("student_id", studentId)
            .eq("status", "completed");
          if (completedCountError) throw completedCountError;

          const spentSeconds = (progressRows ?? []).length > 0 ? (progressRows ?? []).length * 18 * 60 : 0;
          nextQuickStats = {
            tests: String(testCount ?? 0),
            streak: `${completedCount ?? 0} уроков`,
            learningTime: `${Math.floor(spentSeconds / 3600)}h ${Math.floor((spentSeconds % 3600) / 60)}m`
          };
        }

        setProgressValue(nextProgressValue);
        setProgressText(nextProgressText);
        setLastResultText(nextLastResultText);
        setQuickStats(nextQuickStats);
        setHasHomeData(true);
        setIsInitialLoading(false);

        writeDashboardCache(homeCacheKey(userId), {
          modulesData: preparedModules,
          progressValue: nextProgressValue,
          progressText: nextProgressText,
          lastResultText: nextLastResultText,
          quickStats: nextQuickStats
        });
        writeRuntimeCache<DashboardRuntimeSnapshot>(DASHBOARD_RUNTIME_KEY, {
          displayName: nameFromProfile,
          modulesData: preparedModules,
          progressValue: nextProgressValue,
          progressText: nextProgressText,
          lastResultText: nextLastResultText,
          quickStats: nextQuickStats,
          hasHomeData: true
        });
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        if (hasCachedHome) {
          setIsInitialLoading(false);
        }
      }
    }

    loadData();
  }, [router]);

  const userName = displayName.trim();
  const progressOffset = useMemo(
    () => progressCircleLength - (Math.max(0, Math.min(progressValue, 100)) / 100) * progressCircleLength,
    [progressValue]
  );

  return (
    <div className="space-y-8 pb-8">
      <section className="flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-end">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            {userName ? `С возвращением, ${userName}` : "С возвращением"}
          </h1>
          <p className="text-base text-slate-600">Продолжим ваше изучение английского</p>
        </div>
        <div className="flex w-full items-center gap-4 rounded-2xl border border-[#dde2e9] bg-[#eef1f3] p-3 shadow-sm sm:w-auto">
          <div className="flex -space-x-3">
            <div className="h-10 w-10 rounded-full border-4 border-[#eef1f3] bg-[linear-gradient(135deg,#6c63ff,#4f46e5)]" />
            <div className="h-10 w-10 rounded-full border-4 border-[#eef1f3] bg-[linear-gradient(135deg,#f59e0b,#f97316)]" />
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-4 border-[#eef1f3] bg-[#4f46e5] text-[11px] font-bold text-white">
              +4
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Учебная группа</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Сейчас активна</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-3xl border-[#dde2e9] bg-white shadow-[0_20px_40px_rgba(78,68,212,0.07)]">
              <CardContent className="flex items-center justify-between gap-4 p-6 sm:p-7">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-slate-900">Прогресс по курсам</h2>
                  {!hasHomeData && isInitialLoading ? (
                    <>
                      <SkeletonLine className="h-4 w-44" />
                      <SkeletonLine className="h-9 w-24" />
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-slate-600">{progressText}</p>
                      <div className="flex items-end gap-2">
                        <span className="text-4xl font-black text-indigo-700">{progressValue}%</span>
                        <span className="pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">всего</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center sm:h-28 sm:w-28">
                  {!hasHomeData && isInitialLoading ? (
                    <div className="h-full w-full animate-pulse rounded-full bg-slate-200" />
                  ) : (
                    <>
                      <svg viewBox="0 0 112 112" className="h-full w-full -rotate-90">
                        <circle cx="56" cy="56" r={progressRadius} fill="transparent" stroke="#e6ebf2" strokeWidth="8" />
                        <circle
                          cx="56"
                          cy="56"
                          r={progressRadius}
                          fill="transparent"
                          stroke="#5b21b6"
                          strokeDasharray={progressCircleLength}
                          strokeDashoffset={progressOffset}
                          strokeLinecap="round"
                          strokeWidth="8"
                        />
                      </svg>
                      <BookOpen className="absolute h-8 w-8 text-indigo-700" />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-[#dde2e9] bg-white shadow-[0_20px_40px_rgba(78,68,212,0.07)]">
              <CardContent className="space-y-3 p-6 sm:p-7">
                <div className="flex items-center gap-2 text-indigo-700">
                  <Trophy className="h-5 w-5" />
                  <h2 className="text-xl font-bold text-slate-900">Последний результат</h2>
                </div>
                {!hasHomeData && isInitialLoading ? (
                  <>
                    <SkeletonLine className="h-4 w-full" />
                    <SkeletonLine className="h-4 w-4/5" />
                    <SkeletonLine className="h-4 w-3/4" />
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-600">{lastResultText}</p>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <CompactStat
                        icon={<CalendarCheck2 className="h-4 w-4 text-indigo-700" />}
                        label="Тестов"
                        value={quickStats.tests}
                      />
                      <CompactStat icon={<Clock3 className="h-4 w-4 text-indigo-700" />} label="Время" value={quickStats.learningTime} />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Модули обучения</h2>
              <Button
                type="button"
                variant="ghost"
                className="h-9 rounded-xl px-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                onClick={() => router.push("/learning")}
              >
                Все модули
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4">
              {!hasHomeData && isInitialLoading ? (
                moduleLoadingCards.map((card) => (
                  <Card key={card.id} className="rounded-3xl border-[#dde2e9] bg-white">
                    <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                      <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-slate-200" />
                      <div className="flex-1 space-y-2">
                        <SkeletonLine className="h-5 w-1/2" />
                        <SkeletonLine className="h-4 w-full" />
                        <SkeletonLine className="h-4 w-2/3" />
                      </div>
                      <SkeletonLine className="h-8 w-24 rounded-xl" />
                    </CardContent>
                  </Card>
                ))
              ) : null}

              {hasHomeData && modulesData.length === 0 ? (
                <Card className="rounded-3xl border-[#dde2e9] bg-white">
                  <CardContent className="p-5 text-sm text-slate-600">Нет доступных модулей для вашей роли.</CardContent>
                </Card>
              ) : null}

              {modulesData.map((module, index) => (
                <Card key={module.id} className="rounded-3xl border-[#dde2e9] bg-white transition-transform hover:translate-x-1">
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="text-lg font-bold text-slate-900">{module.title}</h3>
                      <p className="text-sm text-slate-600">{module.description}</p>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{module.courseTitle}</p>
                    </div>
                    <Button
                      type="button"
                      variant={index % 2 === 0 ? "default" : "secondary"}
                      className={index % 2 === 0 ? "bg-indigo-700 hover:bg-indigo-800" : ""}
                    >
                      Открыть
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6 xl:col-span-4">
          <Card className="rounded-[2rem] border-[#d9dfe7] bg-[#eef1f3]">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Быстрая статистика</h2>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-700 text-xs font-bold text-white">
                  3
                </span>
              </div>

              {!hasHomeData && isInitialLoading ? (
                <>
                  <QuickStatSkeleton />
                  <QuickStatSkeleton />
                  <QuickStatSkeleton />
                </>
              ) : (
                <>
                  <QuickStatRow
                    icon={<BookOpen className="h-4 w-4 text-indigo-700" />}
                    label="Пройдено тестов"
                    value={quickStats.tests}
                  />
                  <QuickStatRow
                    icon={<Users className="h-4 w-4 text-indigo-700" />}
                    label="Текущая серия"
                    value={quickStats.streak}
                  />
                  <QuickStatRow
                    icon={<Clock3 className="h-4 w-4 text-indigo-700" />}
                    label="Время обучения"
                    value={quickStats.learningTime}
                  />
                </>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-[#dde2e9] bg-white">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-indigo-700" />
                <h2 className="text-xl font-bold text-slate-900">Домашние задания</h2>
              </div>
              <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                В этом разделе вы увидите задания преподавателя, дедлайны и комментарии к проверке.
              </p>
              <Button
                type="button"
                className="w-full rounded-xl bg-indigo-700 text-white hover:bg-indigo-800"
                onClick={() => router.push("/assignments")}
              >
                Перейти к заданиям
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function CompactStat({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e4e8ef] bg-slate-50 px-3 py-2">
      <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function QuickStatRow({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className="text-sm font-bold text-slate-900">{value}</span>
    </div>
  );
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200 ${className}`} />;
}

function QuickStatSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-3">
      <SkeletonLine className="h-4 w-1/2" />
      <SkeletonLine className="h-4 w-16" />
    </div>
  );
}
