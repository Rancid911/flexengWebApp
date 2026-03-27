import Link from "next/link";

import { SearchResultList } from "@/components/search/search-result-list";
import { MainFooter } from "@/app/main/main-footer";
import { MainHeader } from "@/app/main/main-header";
import { searchSite } from "@/lib/search/search-service";
import type { SearchSection } from "@/lib/search/types";

const navItems = [
  { href: "/#programs", label: "Программы" },
  { href: "/#teachers", label: "Преподаватели" },
  { href: "/#pricing", label: "Стоимость" }
];

const searchSections: Array<{ key: SearchSection; label: string }> = [
  { key: "all", label: "Все" },
  { key: "practice", label: "Практика" },
  { key: "homework", label: "Домашнее задание" },
  { key: "words", label: "Слова" },
  { key: "blog", label: "Блог" },
  { key: "admin", label: "Администрирование" }
];

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; section?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const requestedSection = (params.section ?? "all").trim();
  const section = searchSections.some((item) => item.key === requestedSection) ? (requestedSection as SearchSection) : "all";
  const results = await searchSite({ query, limit: 25, section });
  const total = results.items.length;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
      <MainHeader navItems={navItems} />
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-[#5F578E] bg-[linear-gradient(135deg,#2D284A_0%,#3E3762_46%,#4A4476_100%)] p-6 text-white shadow-[0_20px_48px_rgba(25,18,46,0.28)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#d9d4f2]">Глобальный поиск</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {query.length >= 2 ? `Результаты по запросу «${query}»` : "Введите запрос для поиска по сайту"}
              </h1>
              <p className="max-w-3xl text-sm text-[#d9d4f2] sm:text-base">
                Поиск учитывает опубликованный контент, роль пользователя и доступные сущности внутри кабинета.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#d9d4f2]">Результатов</p>
              <p className="mt-1 text-3xl font-semibold text-white">{query.length >= 2 ? total : 0}</p>
            </div>
          </div>
          <form action="/search" className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Например: present simple, домашняя работа, boarding pass"
              className="h-12 flex-1 rounded-2xl border border-white/25 bg-white/95 px-4 text-sm text-slate-900 outline-none transition focus:border-white focus:ring-2 focus:ring-white/30"
            />
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#ffd84d] px-5 text-sm font-semibold text-[#6b5000] transition hover:bg-[#ffe78f]"
            >
              Найти
            </button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {searchSections.map((item) => (
              <Link
                key={item.key}
                href={query ? `/search?q=${encodeURIComponent(query)}&section=${item.key}` : `/search?section=${item.key}`}
                className={`inline-flex h-9 items-center rounded-xl border px-3.5 text-sm font-medium transition ${
                  section === item.key
                    ? "border-white/30 bg-white text-[#2f2a4c] shadow-[0_8px_20px_rgba(17,12,31,0.16)]"
                    : "border-white/12 bg-white/6 text-[#ddd7f2] hover:border-white/20 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[1.8rem] border border-[#e5e9f0] bg-white/90 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur-sm sm:p-5">
          <p className="text-sm font-semibold text-slate-900">
            {query.length >= 2 ? `Показано ${total} результатов` : "Поиск ещё не выполнен"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {query.length >= 2
              ? "Выберите раздел или откройте нужную сущность из списка ниже."
              : "Поиск работает по блогу, практике, домашним заданиям, словам и административным данным с учётом прав доступа."}
          </p>
        </section>

        <section className="rounded-[2rem] border border-[#e5e9f0] bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <SearchResultList
            items={results.items}
            groups={results.groups}
            emptyTitle={query.length >= 2 ? "По запросу ничего не найдено" : "Поиск ещё не выполнен"}
            emptyDescription={
              query.length >= 2
                ? "Попробуйте изменить формулировку или выбрать другой раздел."
                : "Введите запрос выше, чтобы открыть подробную выдачу по блогу, практике, словам и внутренним сущностям."
            }
            query={query}
          />
        </section>
      </main>
      <MainFooter leadHref="/#lead-form" />
    </div>
  );
}
