"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { useCallback, useState } from "react";

import { StudentsDirectorySearch } from "@/app/(workspace)/_components/students-directory/students-directory-search";
import { useCurrentPageDirectoryFilter } from "@/app/(workspace)/_components/students-directory/use-current-page-directory-filter";
import { adminPrimaryButtonClassName } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-button-tokens";
import { AdminPaginationControls } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-pagination-controls";
import { AdminSectionHero } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-section-hero";
import { Card, CardContent } from "@/components/ui/card";

export type AdminTeacherDirectoryItem = {
  teacherId: string;
  profileId: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  createdAt: string | null;
};

type AdminTeachersClientProps = {
  query: string;
  teachers: AdminTeacherDirectoryItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export function AdminTeachersClient({ query, teachers, total, page, pageSize, pageCount }: AdminTeachersClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [immediateQuery, setImmediateQuery] = useState(query);
  const activeSearch = query.length >= 3;
  const safePageCount = Math.max(1, pageCount || Math.ceil(total / pageSize));
  const getTeacherSearchText = useCallback((teacher: AdminTeacherDirectoryItem) => [teacher.displayName, teacher.email, teacher.phone].filter(Boolean).join(" ").toLowerCase(), []);
  const { visibleItems: visibleTeachers, shouldShowFinalEmptyState } = useCurrentPageDirectoryFilter({
    items: teachers,
    immediateQuery,
    serverQuery: query,
    getSearchText: getTeacherSearchText
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
        badgeIcon={GraduationCap}
        badgeLabel="Учителя"
        title="Карточки учителей"
        description="Быстрый доступ к профилям преподавателей, расписанию и будущим рабочим данным команды."
        metricsSlot={
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[1.25rem] border border-white/15 bg-white/10 px-4 py-3 text-white backdrop-blur-sm">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-white/70">Найдено</p>
              <p className="mt-1 text-2xl font-black tracking-[-0.04em]">{visibleTeachers.length}</p>
            </div>
            <div className="rounded-[1.25rem] border border-white/15 bg-white/10 px-4 py-3 text-white backdrop-blur-sm">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-white/70">Поиск</p>
              <p className="mt-1 text-sm font-black text-white">{activeSearch ? "Активен" : "Все учителя"}</p>
            </div>
          </div>
        }
      />

      <Card className="rounded-[2rem] border-[#dfe9fb] bg-white shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-black tracking-[-0.04em] text-slate-900">Список учителей</h2>
              <p className="mt-1 text-sm text-slate-600">Ищите преподавателя по имени, email или телефону и открывайте рабочую карточку.</p>
            </div>
            <StudentsDirectorySearch
              serverQuery={query}
              value={immediateQuery}
              ariaLabel="Поиск учителя"
              onValueChange={setImmediateQuery}
            />
          </div>

          <section className="space-y-3" aria-label="Список учителей">
            {visibleTeachers.length > 0 ? (
              visibleTeachers.map((teacher) => (
                <div key={teacher.teacherId} className="rounded-[1.35rem] border border-[#dfe9fb] bg-[#fbfdff] px-4 py-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div>
                        <p className="font-black text-slate-900">{teacher.displayName}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {teacher.email ?? "Email не указан"}
                          {teacher.phone ? ` · ${teacher.phone}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                        <span>
                          Роль: <span className="font-semibold text-slate-900">Преподаватель</span>
                        </span>
                        <span>
                          Карточка: <span className="font-semibold text-slate-900">Готова к заполнению</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:shrink-0">
                      <Link href={`/admin/teachers/${teacher.teacherId}`} className={`inline-flex h-10 shrink-0 items-center justify-center px-4 text-sm transition ${adminPrimaryButtonClassName}`}>
                        Открыть карточку
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.35rem] border border-dashed border-[#d7e4f5] bg-[#f8fbff] px-5 py-8 text-sm text-slate-600">
                {shouldShowFinalEmptyState ? (activeSearch ? "По запросу ничего не найдено." : "Учителя пока не найдены.") : ""}
              </div>
            )}
          </section>

          <div className="border-t border-[#edf2fb] pt-3">
            <p className="text-xs font-semibold text-slate-500">
              Показано {visibleTeachers.length} из {total}
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
