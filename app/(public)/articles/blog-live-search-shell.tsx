"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Clock3, Eye, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { BlogFeedClient } from "@/app/(public)/articles/blog-feed-client";
import { BlogCoverImage } from "@/components/blog/blog-cover-image";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { BlogCategoryDto, BlogPostCardDto, BlogTagDto } from "@/lib/admin/types";

type BlogLiveSearchShellProps = {
  categories: BlogCategoryDto[];
  tags: BlogTagDto[];
  popular: Array<{ id: string; slug: string; title: string; views_count: number }>;
  editorial: BlogPostCardDto[];
  initialItems: BlogPostCardDto[];
  initialPage: number;
  initialPageCount: number;
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
  initialQ,
  initialCategory,
  initialTag,
  initialSort
}: BlogLiveSearchShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [queryInput, setQueryInput] = useState(initialQ);
  const debouncedQuery = useDebouncedValue(queryInput.trim(), 400);

  const buildHref = useCallback(({
    q = initialQ,
    category = initialCategory,
    tag = initialTag,
    sort = initialSort,
    page = initialPage
  }: {
    q?: string;
    category?: string;
    tag?: string;
    sort?: "new" | "popular";
    page?: number;
  }) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (tag) params.set("tag", tag);
    if (sort !== "new") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    const search = params.toString();
    return search ? `${pathname}?${search}` : pathname;
  }, [initialCategory, initialPage, initialQ, initialSort, initialTag, pathname]);

  const navigate = useCallback((next: Parameters<typeof buildHref>[0]) => {
    startTransition(() => {
      router.replace(buildHref(next), { scroll: false });
    });
  }, [buildHref, router]);

  useEffect(() => {
    setQueryInput(initialQ);
  }, [initialQ]);

  useEffect(() => {
    const nextQuery = debouncedQuery.length >= 2 ? debouncedQuery : "";
    if (nextQuery === initialQ) return;
    navigate({ q: nextQuery, page: 1 });
  }, [debouncedQuery, initialQ, navigate]);

  const resetFilters = () => {
    setQueryInput("");
    navigate({ q: "", category: "", tag: "", sort: "new", page: 1 });
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
          <h1 className="content-heading-balance mt-2 max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">Материалы для изучающих английский</h1>
          <p className="content-measure mt-3 max-w-4xl text-sm text-[#D9D4F2] sm:text-base">
            Практические статьи по грамматике, разговорным ситуациям, английскому для работы и путешествий. Выбирайте тему и
            учитесь в своём темпе.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
              <Input
                value={queryInput}
                onChange={(event) => {
                  setQueryInput(event.target.value);
                }}
                placeholder="Поиск по заголовку или теме"
                className="h-11 w-full rounded-xl border-[#D1D5DB] bg-white pl-10 pr-3 text-sm text-[#1F2937] placeholder:text-[#6B7280] focus-visible:border-[#8D70FF] focus-visible:ring-[#8D70FF]"
                aria-label="Поиск по статьям"
              />
            </div>
            <Select
              value={initialSort}
              onChange={(event) => {
                navigate({ sort: event.target.value === "popular" ? "popular" : "new", page: 1 });
              }}
              className="h-11 rounded-xl border-[#D1D5DB] bg-white px-3 text-sm text-[#111111] focus-visible:border-[#8D70FF] focus-visible:ring-[#8D70FF]"
              aria-label="Сортировка статей"
            >
              <option value="new">Сначала новые</option>
              <option value="popular">Сначала популярные</option>
            </Select>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#B7B0DF] bg-white/10 px-5 text-sm font-semibold text-[#F3EEFF] transition-[background-color,border-color,color,box-shadow] hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              Сбросить фильтры
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                navigate({ category: "", page: 1 });
              }}
                className={`inline-flex h-9 items-center rounded-xl border px-3.5 text-sm font-medium transition-[background-color,border-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
                  !initialCategory
                    ? "border-white/30 bg-white text-[#2f2a4c] shadow-[0_8px_20px_rgba(17,12,31,0.16)]"
                    : "border-white/12 bg-white/6 text-[#ddd7f2] hover:border-white/20 hover:bg-white/10 hover:text-white"
              }`}
            >
              Все категории
            </button>
            {categories.map((item, index) => (
              <button
                key={`${item.id || item.slug || "category"}-${index}`}
                type="button"
                onClick={() => {
                  navigate({ category: item.slug, page: 1 });
                }}
                className={`inline-flex h-9 items-center rounded-xl border px-3.5 text-sm font-medium transition-[background-color,border-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
                  initialCategory === item.slug
                    ? "border-white/30 bg-white text-[#2f2a4c] shadow-[0_8px_20px_rgba(17,12,31,0.16)]"
                    : "border-white/12 bg-white/6 text-[#ddd7f2] hover:border-white/20 hover:bg-white/10 hover:text-white"
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
          <h2 className="content-heading-balance max-w-[14ch] text-2xl font-semibold tracking-tight text-[#111111]">Выбор редакции</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {editorial.map((post, index) => (
              <Link
                key={`${post.id || post.slug || "editorial"}-${index}`}
                href={`/articles/${post.slug}`}
                className="blog-card-surface blog-card-link group block p-4"
              >
                <div className="mb-3 h-40 overflow-hidden rounded-xl bg-[linear-gradient(145deg,#eef2f7_0%,#f8faff_60%,#eef2f7_100%)]">
                  {post.cover_image_url ? (
                    <div className="relative h-full w-full">
                      <BlogCoverImage src={post.cover_image_url} alt={post.title} sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-semibold text-[#374151]">Статья Флексенг</div>
                  )}
                </div>
                <p className="text-xs text-[#6B7280]">{post.category?.name ?? "Без категории"}</p>
                <h3 className="content-heading-balance mt-1 line-clamp-2 text-lg font-semibold tracking-tight text-[#111111] transition-colors duration-150 group-hover:text-[#2f2a4c] group-focus-visible:text-[#2f2a4c]">
                  {post.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#4B5563]">{post.excerpt ?? "Откройте статью, чтобы прочитать материал."}</p>
                <div className="blog-meta-row mt-3">
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
          items={initialItems}
          page={initialPage}
          pageCount={initialPageCount}
          buildPageHref={(nextPage) => buildHref({ page: nextPage })}
        />
        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <h3 className="content-heading-balance max-w-[16ch] text-base font-semibold tracking-tight text-[#111111]">Популярные теги</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.slice(0, 20).map((item, index) => (
                <Link
                  key={`${item.id || item.slug || "tag"}-${index}`}
                  href={buildHref({ tag: item.slug, page: 1 })}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-[background-color,border-color,color,box-shadow] duration-75 ease-out hover:duration-300 ${
                    initialTag === item.slug
                      ? "border-[#322F55] bg-[#4A4476] text-[#F3EEFF]"
                      : "border-[#D1D5DB] text-[#374151] hover:border-[#322F55] hover:bg-[#4A4476] hover:text-[#F3EEFF]"
                  }`}
                >
                  #{item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <h3 className="content-heading-balance max-w-[16ch] text-base font-semibold tracking-tight text-[#111111]">Самое читаемое</h3>
            <div className="mt-3 space-y-2">
              {popular.map((item, index) => (
                <Link
                  key={`${item.id || item.slug || "popular"}-${index}`}
                  href={`/articles/${item.slug}`}
                  className="block rounded-xl px-2.5 py-2 text-sm text-[#111111] transition-[background-color,color,box-shadow] hover:bg-[#f7f9ff] hover:text-[#2f2a4c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D70FF] focus-visible:ring-inset"
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
