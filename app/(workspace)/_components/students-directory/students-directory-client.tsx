"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UsersRound } from "lucide-react";
import { useCallback, useState } from "react";

import { adminPrimaryButtonClassName } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-button-tokens";
import { AdminPaginationControls } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-pagination-controls";
import { AdminSectionHero } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-section-hero";
import { StudentsDirectorySearch } from "@/app/(workspace)/_components/students-directory/students-directory-search";
import { useCurrentPageDirectoryFilter } from "@/app/(workspace)/_components/students-directory/use-current-page-directory-filter";
import { Card, CardContent } from "@/components/ui/card";
import { formatScheduleDateLabel } from "@/lib/schedule/utils";

export type StudentsDirectoryItem = {
  id: string;
  studentId: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  englishLevel: string | null;
  targetLevel: string | null;
  assignedTeacherName?: string | null;
  billingBalanceLabel?: string | null;
  billingDebtLabel?: string | null;
  activeHomeworkCount?: number | null;
  nextLessonAt?: string | null;
};

type StudentsDirectoryClientProps = {
  mode: "admin" | "teacher";
  basePath: string;
  query: string;
  students: StudentsDirectoryItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export function StudentsDirectoryClient({
  mode,
  basePath,
  query,
  students,
  total,
  page,
  pageSize,
  pageCount
}: StudentsDirectoryClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [immediateQuery, setImmediateQuery] = useState(query);
  const activeSearch = query.length >= 3;
  const safePageCount = Math.max(1, pageCount || Math.ceil(total / pageSize));
  const isAdmin = mode === "admin";
  const getStudentSearchText = useCallback(
    (student: StudentsDirectoryItem) =>
      [student.displayName, student.email, student.phone, student.englishLevel, student.targetLevel, student.assignedTeacherName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    []
  );
  const { visibleItems: visibleStudents, shouldShowFinalEmptyState } = useCurrentPageDirectoryFilter({
    items: students,
    immediateQuery,
    serverQuery: query,
    getSearchText: getStudentSearchText
  });

  const navigateToPage = (nextPage: number) => {
    const params = new URLSearchParams();
    if (activeSearch) {
      params.set("q", query);
    }
    if (nextPage > 1) {
      params.set("page", String(nextPage));
    } else if (activeSearch) {
      params.set("page", "1");
    }
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  return (
    <div className="space-y-5 pb-8">
      <AdminSectionHero
        badgeIcon={UsersRound}
        badgeLabel="Ученики"
        title="Карточки учеников"
        description={
          isAdmin
            ? "Быстрый доступ к урокам, placement test, домашним заданиям, заметкам, оплате и списаниям."
            : "Быстрый доступ к урокам, placement test, домашним заданиям, заметкам и ошибкам ваших учеников."
        }
        metricsSlot={
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[1.25rem] border border-white/15 bg-white/10 px-4 py-3 text-white backdrop-blur-sm">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-white/70">Найдено</p>
              <p className="mt-1 text-2xl font-black tracking-[-0.04em]">{visibleStudents.length}</p>
            </div>
            <div className="rounded-[1.25rem] border border-white/15 bg-white/10 px-4 py-3 text-white backdrop-blur-sm">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-white/70">Поиск</p>
              <p className="mt-1 text-sm font-black text-white">{activeSearch ? "Активен" : "Все ученики"}</p>
            </div>
          </div>
        }
      />

      <Card className="rounded-[2rem] border-[#dfe9fb] bg-white shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-black tracking-[-0.04em] text-slate-900">Список учеников</h2>
              <p className="mt-1 text-sm text-slate-600">
                {isAdmin
                  ? "Ищите ученика по имени, email или телефону и открывайте полную карточку с учебной и billing-информацией."
                  : "Ищите ученика по имени, email или телефону и открывайте его учебную карточку."}
              </p>
            </div>
            <StudentsDirectorySearch
              serverQuery={query}
              value={immediateQuery}
              onValueChange={setImmediateQuery}
            />
          </div>

          <section className="space-y-3" aria-label="Список учеников">
            {visibleStudents.length > 0 ? (
              visibleStudents.map((student) => (
                <div key={student.id} className="rounded-[1.35rem] border border-[#dfe9fb] bg-[#fbfdff] px-4 py-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div>
                        <p className="font-black text-slate-900">{student.displayName}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {student.email ?? "Email не указан"}
                          {student.phone ? ` · ${student.phone}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                        <span>
                          Уровень: <span className="font-semibold text-slate-900">{student.englishLevel ?? "—"}</span>
                        </span>
                        <span>
                          Цель: <span className="font-semibold text-slate-900">{student.targetLevel ?? "—"}</span>
                        </span>
                        {isAdmin ? (
                          <span>
                            Преподаватель: <span className="font-semibold text-slate-900">{student.assignedTeacherName ?? "—"}</span>
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:shrink-0">
                      {isAdmin ? (
                        <div className="min-w-[180px] rounded-[1.1rem] border border-[#e6edf8] bg-white px-3 py-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Доступно уроков</p>
                          <p className="mt-1 text-sm font-black text-slate-900">{student.billingBalanceLabel ?? "—"}</p>
                          {student.billingDebtLabel ? <p className="mt-1 text-xs font-bold text-rose-600">Долг: {student.billingDebtLabel}</p> : null}
                        </div>
                      ) : (
                        <div className="min-w-[200px] rounded-[1.1rem] border border-[#e6edf8] bg-white px-3 py-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Учебный статус</p>
                          <p className="mt-1 text-sm font-black text-slate-900">Активных ДЗ: {student.activeHomeworkCount ?? 0}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {student.nextLessonAt ? `Следующий урок: ${formatScheduleDateLabel(student.nextLessonAt)}` : "Следующий урок не назначен"}
                          </p>
                        </div>
                      )}
                      <Link href={`${basePath}/${student.studentId}`} className={`inline-flex h-10 shrink-0 items-center justify-center px-4 text-sm transition ${adminPrimaryButtonClassName}`}>
                        Открыть карточку
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.35rem] border border-dashed border-[#d7e4f5] bg-[#f8fbff] px-5 py-8 text-sm text-slate-600">
                {shouldShowFinalEmptyState ? (activeSearch ? "По запросу ничего не найдено." : "Ученики пока не найдены.") : ""}
              </div>
            )}
          </section>

          <div className="border-t border-[#edf2fb] pt-3">
            <p className="text-xs font-semibold text-slate-500">
              Показано {visibleStudents.length} из {total}
            </p>
            <AdminPaginationControls
              page={page}
              pageCount={safePageCount}
              onFirst={() => navigateToPage(1)}
              onPrev={() => navigateToPage(Math.max(1, page - 1))}
              onNext={() => navigateToPage(Math.min(safePageCount, page + 1))}
              onLast={() => navigateToPage(safePageCount)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
