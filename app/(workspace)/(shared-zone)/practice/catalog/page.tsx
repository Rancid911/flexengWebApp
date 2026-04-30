import Link from "next/link";

import { StudentEmptyState, StudentPageHeader, StudentSubnav } from "@/app/(workspace)/_components/student-page-primitives";
import { Card, CardContent } from "@/components/ui/card";
import { getPracticeActivityCatalog, type PracticeCatalogFilter } from "@/lib/practice/queries";

const filters: Array<{ value: PracticeCatalogFilter; label: string }> = [
  { value: "all", label: "Все" },
  { value: "trainers", label: "Тренажёры" },
  { value: "tests", label: "Тесты" },
  { value: "assigned", label: "Назначено" }
];

export default async function PracticeCatalogPage({
  searchParams
}: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  const rawSearchParams = (await searchParams) ?? {};
  const filter = filters.some((item) => item.value === rawSearchParams.filter) ? (rawSearchParams.filter as PracticeCatalogFilter) : "all";
  const items = await getPracticeActivityCatalog(filter);

  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader title="Каталог drills и тестов" description="Здесь доступны материалы вашего уровня. Назначенные преподавателем активности показываются отдельным фильтром." />
      <StudentSubnav
        items={[
          { href: "/practice", label: "Обзор" },
          { href: "/practice/catalog", label: "Каталог", active: true },
          { href: "/practice/recommended", label: "Рекомендовано" },
          { href: "/practice/topics", label: "Темы" },
          { href: "/practice/mistakes", label: "Ошибки" }
        ]}
      />
      <div className="flex flex-wrap gap-2">
        {filters.map((option) => (
          <Link
            key={option.value}
            href={option.value === "all" ? "/practice/catalog" : `/practice/catalog?filter=${option.value}`}
            className={`inline-flex min-h-10 items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
              option.value === filter ? "bg-indigo-600 text-white" : "bg-white text-slate-700 ring-1 ring-[#dde2e9] hover:bg-slate-50"
            }`}
          >
            {option.label}
          </Link>
        ))}
      </div>

      {items.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <Card key={item.id} className="rounded-[1.8rem] border-[#dde2e9] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wide">
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">{item.activityType === "trainer" ? "Тренажёр" : "Тест"}</span>
                  {item.cefrLevel ? <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{item.cefrLevel}</span> : null}
                  {item.assigned ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Назначено</span> : null}
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-900">{item.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{item.description ?? "Активность для самостоятельной практики."}</p>
                  {(item.drillTopicKey || item.drillKind) ? (
                    <p className="mt-2 text-xs text-slate-500">
                      {item.drillTopicKey ?? "без темы"}
                      {item.drillKind ? ` · ${item.drillKind}` : ""}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-500">{item.progressLabel}</p>
                  <Link
                    href={`/practice/activity/${item.id}`}
                    className="inline-flex min-h-10 items-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Открыть
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <StudentEmptyState title="Материалы не найдены" description="Для выбранного фильтра пока нет доступных drills или тестов." />
      )}
    </div>
  );
}
