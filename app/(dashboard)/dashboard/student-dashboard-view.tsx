"use client";

import {
  ArrowRight,
  BookOpen,
  CalendarCheck2,
  Clock3,
  Layers,
  Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
const DASHBOARD_RUNTIME_KEY = "student-dashboard:v1";

type HomeworkCard = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  statusTone: "primary" | "warning" | "muted";
};

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

  const lessonOfTheDay = useMemo(
    () =>
      modulesData[0] ?? {
        id: "lesson-of-the-day",
        title: "Ваш следующий урок",
        description: "Откройте раздел обучения, чтобы продолжить занятия и увидеть персональные рекомендации.",
        courseTitle: "Флексенг"
      },
    [modulesData]
  );

  const learnerName = displayName.trim();

  const homeworkCards = useMemo<HomeworkCard[]>(
    () =>
      modulesData.slice(0, 2).map((module, index): HomeworkCard => ({
        id: module.id,
        title: module.title,
        subtitle: index === 0 ? "Следующий шаг по программе" : `Курс: ${module.courseTitle}`,
        status: index === 0 ? "Не начато" : "В процессе",
        statusTone: index === 0 ? "muted" : "primary"
      })),
    [modulesData]
  );

  const recommendationCards = useMemo(
    () =>
      (modulesData.slice(1, 3).length > 0 ? modulesData.slice(1, 3) : modulesData.slice(0, 2)).map((module) => ({
        id: module.id,
        title: module.title,
        subtitle: module.description
      })),
    [modulesData]
  );

  const resultPercent = useMemo(() => {
    const match = lastResultText.match(/(\d+)%/);
    return match ? `${match[1]}%` : "—";
  }, [lastResultText]);

  const vocabularyCount = useMemo(() => {
    if (modulesData.length === 0) return "0";
    return String(modulesData.length * 6);
  }, [modulesData.length]);

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
              {isInitialLoading && !hasHomeData ? (
                <>
                  <SkeletonLine className="h-11 w-48 bg-white/25" />
                  <SkeletonLine className="h-5 w-full max-w-xl bg-white/20" />
                  <SkeletonLine className="h-5 w-4/5 bg-white/20" />
                </>
              ) : (
                <>
                  <h1 className="text-4xl font-black tracking-[-0.06em] text-white sm:text-5xl">{lessonOfTheDay.title}</h1>
                  <p className="max-w-2xl text-sm leading-6 text-[#ecf6ff] sm:text-base">{lessonOfTheDay.description}</p>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <MetaPill icon={<Clock3 className="h-4 w-4" />} text={quickStats.learningTime === "…" ? "6 минут" : quickStats.learningTime} />
              <MetaPill icon={<CalendarCheck2 className="h-4 w-4" />} text={`${progressValue}% пройдено`} />
              <MetaPill icon={<Layers className="h-4 w-4" />} text={`${Math.max(1, modulesData.length)} разделов в курсе`} />
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
                {isInitialLoading && !hasHomeData ? (
                  <>
                    <SkeletonLine className="mt-3 h-12 w-28 bg-white/25" />
                    <SkeletonLine className="mt-4 h-3 w-full rounded-full bg-white/20" />
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-5xl font-black tracking-[-0.06em]">{progressValue}%</p>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/20">
                      <span
                        className="block h-full rounded-full bg-white transition-[width] duration-500"
                        style={{ width: `${Math.max(0, Math.min(progressValue, 100))}%` }}
                      />
                    </div>
                    <p className="mt-3 text-sm text-[#e7f4ff]">{progressText}</p>
                  </>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <HeroInfoCard label="Точность" value={resultPercent} />
                <HeroInfoCard label="Стрик" value={quickStats.streak} />
                <HeroInfoCard label="Слов" value={vocabularyCount} />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="rounded-[2rem] border-[#dfe9fb] bg-white shadow-[0_18px_44px_rgba(27,73,155,0.1)]">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black tracking-[-0.04em] text-[#12203b]">Домашние задания</h2>
              <StatusBadge tone="warning">{homeworkCards.length > 0 ? `${homeworkCards.length} активных` : "Пусто"}</StatusBadge>
            </div>
            <div className="space-y-3">
              {isInitialLoading && !hasHomeData ? (
                moduleLoadingCards.map((card) => (
                  <div key={card.id} className="rounded-[1.35rem] border border-[#dfe9fb] bg-white p-4">
                    <SkeletonLine className="h-5 w-1/2" />
                    <SkeletonLine className="mt-2 h-4 w-32" />
                  </div>
                ))
              ) : homeworkCards.length > 0 ? (
                homeworkCards.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => router.push("/assignments")}
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
                <div className="rounded-[1.35rem] border border-[#dfe9fb] bg-[#f8fbff] px-4 py-5 text-sm text-[#6d7fa3]">
                  Домашних заданий пока нет. Следующий материал появится после открытия следующего урока.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-[#dfe9fb] bg-white shadow-[0_18px_44px_rgba(27,73,155,0.1)]">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black tracking-[-0.04em] text-[#12203b]">Рекомендовано</h2>
              <StatusBadge tone="primary">Под ваш уровень</StatusBadge>
            </div>
            <div className="space-y-3">
              {isInitialLoading && !hasHomeData ? (
                moduleLoadingCards.map((card) => (
                  <div key={card.id} className="rounded-[1.35rem] border border-[#dfe9fb] bg-white p-4">
                    <SkeletonLine className="h-5 w-3/5" />
                    <SkeletonLine className="mt-2 h-4 w-4/5" />
                  </div>
                ))
              ) : recommendationCards.length > 0 ? (
                recommendationCards.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => router.push("/learning")}
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
                <div className="rounded-[1.35rem] border border-[#dfe9fb] bg-[#f8fbff] px-4 py-5 text-sm text-[#6d7fa3]">
                  {learnerName ? `${learnerName}, рекомендации появятся после первых выполненных заданий и тестов.` : "Рекомендации появятся после того, как вы выполните первые задания и тесты."}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <SummaryCard label="Сегодня" value={quickStats.learningTime} chip="продуктивно" icon={<Sparkles className="h-4 w-4" />} />
        <SummaryCard label="Сделано тестов" value={quickStats.tests} chip="за месяц" icon={<BookOpen className="h-4 w-4" />} />
        <SummaryCard label="Карточек в повторении" value={vocabularyCount} chip="словарь" icon={<Layers className="h-4 w-4" />} />
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
  tone: "primary" | "warning" | "muted";
}) {
  const className =
    tone === "primary"
      ? "bg-[#eaf4ff] text-[#1f7aff]"
      : tone === "warning"
        ? "bg-[#fff4df] text-[#bc7500]"
        : "bg-[#f3f6fc] text-[#60708e]";

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-black ${className}`}>{children}</span>
  );
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200 ${className}`} />;
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
    <Card className="rounded-[1.7rem] border-[#dfe9fb] bg-white shadow-[0_8px_24px_rgba(27,73,155,0.08)]">
      <CardContent className="space-y-3 p-5">
        <p className="text-sm text-[#6d7fa3]">{label}</p>
        <p className="text-4xl font-black tracking-[-0.05em] text-[#12203b]">{value}</p>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#dfe9fb] bg-[#f5f9ff] px-3 py-1.5 text-sm font-bold text-[#5b6990]">
          {icon}
          {chip}
        </span>
      </CardContent>
    </Card>
  );
}
