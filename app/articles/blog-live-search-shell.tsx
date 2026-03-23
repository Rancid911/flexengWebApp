"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Clock3, Eye, Search } from "lucide-react";

import { BlogFeedClient } from "@/app/articles/blog-feed-client";
import type { BlogCategoryDto, BlogPostCardDto, BlogTagDto } from "@/lib/admin/types";

type BlogLiveSearchShellProps = {
  categories: BlogCategoryDto[];
  tags: BlogTagDto[];
  popular: Array<{ id: string; slug: string; title: string; views_count: number }>;
  editorial: BlogPostCardDto[];
  initialItems: BlogPostCardDto[];
  initialPage: number;
  initialPageCount: number;
  initialTotal: number;
  pageSize: number;
  initialQ: string;
  initialCategory: string;
  initialTag: string;
  initialSort: "new" | "popular";
};

export function BlogLiveSearchShell({
  categories,
  tags,
  popular,
  editorial,
  initialItems,
  initialPage,
  initialPageCount,
  initialTotal,
  pageSize,
  initialQ,
  initialCategory,
  initialTag,
  initialSort
}: BlogLiveSearchShellProps) {
  const [queryInput, setQueryInput] = useState(initialQ);
  const [query, setQuery] = useState(initialQ);
  const [category, setCategory] = useState(initialCategory);
  const [tag, setTag] = useState(initialTag);
  const [sort, setSort] = useState<"new" | "popular">(initialSort);

  useEffect(() => {
    const timer = setTimeout(() => {
      const normalized = queryInput.trim();
      if (normalized.length === 0) {
        setQuery("");
        return;
      }

      setQuery(normalized.length >= 2 ? normalized : "");
    }, 400);

    return () => clearTimeout(timer);
  }, [queryInput]);

  const resetFilters = () => {
    setQueryInput("");
    setQuery("");
    setCategory("");
    setTag("");
    setSort("new");
    if (typeof window !== "undefined") {
      window.history.replaceState(window.history.state, "", "/articles");
    }
  };

  const sectionClassName = useMemo(
    () =>
      "relative overflow-hidden rounded-3xl border border-[#5F578E] bg-[linear-gradient(135deg,#2D284A_0%,#3E3762_46%,#4A4476_100%)] p-6 shadow-[0_20px_48px_rgba(25,18,46,0.32)] sm:p-8",
    []
  );

  return (
    <>
      <section className={sectionClassName}>
        <div className="blog-hero-blob blog-hero-blob-a" />
        <div className="blog-hero-blob blog-hero-blob-b" />
        <div className="blog-hero-blob blog-hero-blob-c" />

        <div className="relative z-10">
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Материалы для изучающих английский</h1>
          <p className="mt-3 max-w-3xl text-sm text-[#D9D4F2] sm:text-base">
            Практические статьи по грамматике, разговорным ситуациям, английскому для работы и путешествий. Выбирайте тему и
            учитесь в своём темпе.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
              <input
                value={queryInput}
                onChange={(event) => {
                  setQueryInput(event.target.value);
                }}
                placeholder="Поиск по заголовку или теме"
                className="h-11 w-full rounded-xl border border-[#D1D5DB] bg-white pl-10 pr-3 text-sm text-[#1F2937] placeholder:text-[#6B7280] outline-none ring-0 transition focus:border-[#8D70FF]"
              />
            </div>
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value === "popular" ? "popular" : "new");
              }}
              className="h-11 rounded-xl border border-[#D1D5DB] bg-white px-3 text-sm text-[#111111] outline-none transition focus:border-[#8D70FF]"
            >
              <option value="new">Сначала новые</option>
              <option value="popular">Сначала популярные</option>
            </select>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#B7B0DF] bg-white/10 px-5 text-sm font-semibold text-[#F3EEFF] transition hover:bg-white/20"
            >
              Сбросить фильтры
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setCategory("");
              }}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                !category
                  ? "border-[#8D70FF] bg-[#4A4476] text-white"
                  : "border-white/35 bg-white/10 text-[#ECE8FF] hover:border-white/55 hover:bg-white/20 hover:text-white"
              }`}
            >
              Все категории
            </button>
            {categories.map((item, index) => (
              <button
                key={`${item.id || item.slug || "category"}-${index}`}
                type="button"
                onClick={() => {
                  setCategory(item.slug);
                }}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  category === item.slug
                    ? "border-[#8D70FF] bg-[#4A4476] text-white"
                    : "border-white/35 bg-white/10 text-[#ECE8FF] hover:border-white/55 hover:bg-white/20 hover:text-white"
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {editorial.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-[#111111]">Выбор редакции</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {editorial.map((post, index) => (
              <Link
                key={`${post.id || post.slug || "editorial"}-${index}`}
                href={`/articles/${post.slug}`}
                className="group rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm transition-all duration-75 ease-out hover:duration-300 hover:-translate-y-0.5 hover:border-[#322F55] hover:bg-[#4A4476] hover:shadow-md"
              >
                <div className="mb-3 h-40 overflow-hidden rounded-xl bg-[linear-gradient(145deg,#F3F4F6_0%,#F9FAFB_60%,#F3F4F6_100%)]">
                  {post.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.cover_image_url} alt={post.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-semibold text-[#374151] transition-colors duration-75 ease-out group-hover:duration-300 group-hover:text-[#F3EEFF]">Статья Флексенг</div>
                  )}
                </div>
                <p className="text-xs text-[#6B7280] transition-colors duration-75 ease-out group-hover:duration-300 group-hover:text-[#DAD3F3]">{post.category?.name ?? "Без категории"}</p>
                <h3 className="mt-1 line-clamp-2 text-lg font-semibold text-[#111111] transition-colors duration-75 ease-out group-hover:duration-300 group-hover:text-[#F3EEFF]">{post.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-[#4B5563] transition-colors duration-75 ease-out group-hover:duration-300 group-hover:text-[#DAD3F3]">{post.excerpt ?? "Откройте статью, чтобы прочитать материал."}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-[#6B7280] transition-colors duration-75 ease-out group-hover:duration-300 group-hover:text-[#DAD3F3]">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    {post.reading_time_min ?? 5} мин
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {post.views_count}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <BlogFeedClient
          initialItems={initialItems}
          initialPage={initialPage}
          initialPageCount={initialPageCount}
          initialTotal={initialTotal}
          pageSize={pageSize}
          q={query}
          category={category}
          tag={tag}
          sort={sort}
        />
        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <h3 className="text-base font-semibold text-[#111111]">Популярные теги</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.slice(0, 20).map((item, index) => (
                <Link
                  key={`${item.id || item.slug || "tag"}-${index}`}
                  href={`/articles?tag=${encodeURIComponent(item.slug)}&sort=${sort}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-all duration-75 ease-out hover:duration-300 ${tag === item.slug ? "border-[#322F55] bg-[#4A4476] text-[#F3EEFF]" : "border-[#D1D5DB] text-[#374151] hover:border-[#322F55] hover:bg-[#4A4476] hover:text-[#F3EEFF]"}`}
                >
                  #{item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <h3 className="text-base font-semibold text-[#111111]">Самое читаемое</h3>
            <div className="mt-3 space-y-2">
              {popular.map((item, index) => (
                <Link
                  key={`${item.id || item.slug || "popular"}-${index}`}
                  href={`/articles/${item.slug}`}
                  className="block rounded px-2 py-1.5 text-sm text-[#111111] transition-all duration-75 ease-out hover:duration-300 hover:bg-[#4A4476] hover:text-[#F3EEFF]"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}
