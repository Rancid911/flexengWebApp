"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Clock3, Eye } from "lucide-react";

import type { BlogPostCardDto, PaginatedResponse } from "@/lib/admin/types";

type BlogFeedClientProps = {
  initialItems: BlogPostCardDto[];
  initialPage: number;
  initialPageCount: number;
  initialTotal: number;
  pageSize: number;
  q: string;
  category: string;
  tag: string;
  sort: "new" | "popular";
};

function buildParams({
  page,
  pageSize,
  q,
  category,
  tag,
  sort
}: {
  page: number;
  pageSize: number;
  q: string;
  category: string;
  tag: string;
  sort: "new" | "popular";
}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  params.set("sort", sort);
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  if (tag) params.set("tag", tag);
  return params;
}

export function BlogFeedClient({
  initialItems,
  initialPage,
  initialPageCount,
  initialTotal,
  pageSize,
  q,
  category,
  tag,
  sort
}: BlogFeedClientProps) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(initialPage);
  const [pageCount, setPageCount] = useState(initialPageCount);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);
  const didMountRef = useRef(false);
  const previousFilterKeyRef = useRef(`${q}|${category}|${tag}|${sort}`);

  useEffect(() => {
    setItems(initialItems);
    setPage(initialPage);
    setPageCount(initialPageCount);
    setLoading(false);
  }, [initialItems, initialPage, initialPageCount, initialTotal]);

  const syncUrl = useCallback(
    (nextPage: number) => {
      if (typeof window === "undefined") return;
      const params = buildParams({
        page: nextPage,
        pageSize,
        q,
        category,
        tag,
        sort
      });
      window.history.replaceState(window.history.state, "", `/articles?${params.toString()}`);
    },
    [category, pageSize, q, sort, tag]
  );

  const fetchPage = useCallback(
    async (nextPage: number, force = false) => {
      if (loading) return;
      if (!force && (nextPage === page || nextPage < 1 || nextPage > pageCount)) return;

      setLoading(true);
      requestIdRef.current += 1;
      const requestId = requestIdRef.current;

      try {
        const params = buildParams({
          page: nextPage,
          pageSize,
          q,
          category,
          tag,
          sort
        });
        const response = await fetch(`/api/blog/posts?${params.toString()}`, { cache: "no-store" });
        if (!response.ok) return;

        const payload = (await response.json()) as PaginatedResponse<BlogPostCardDto>;
        if (requestId !== requestIdRef.current) return;

        setItems(payload.items ?? []);
        const resolvedPage = payload.page ?? nextPage;
        setPage(resolvedPage);
        setPageCount(Math.max(1, Math.ceil((payload.total ?? 0) / Math.max(1, payload.pageSize ?? pageSize))));
        syncUrl(resolvedPage);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [category, loading, page, pageCount, pageSize, q, sort, syncUrl, tag]
  );

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      previousFilterKeyRef.current = `${q}|${category}|${tag}|${sort}`;
      return;
    }

    const nextFilterKey = `${q}|${category}|${tag}|${sort}`;
    if (nextFilterKey === previousFilterKeyRef.current) return;
    previousFilterKeyRef.current = nextFilterKey;
    void fetchPage(1, true);
  }, [category, fetchPage, q, sort, tag]);

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold text-[#111111]">Все статьи</h2>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 text-sm text-[#4B5563]">Пока статей по выбранным фильтрам нет.</div>
      ) : (
        <div className={`grid gap-3 transition-opacity ${loading ? "opacity-85" : "opacity-100"}`}>
          {items.map((post, index) => (
            <Link
              key={`${post.id || post.slug || "post"}-${index}`}
              href={`/articles/${post.slug}`}
              className="group rounded-2xl border border-[#E5E7EB] bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] p-4 shadow-sm transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-[#d7dff0] hover:bg-[linear-gradient(180deg,#ffffff_0%,#f7faff_100%)] hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
            >
              <p className="text-xs text-[#6B7280]">{post.category?.name ?? "Без категории"}</p>
              <h3 className="mt-1 text-lg font-semibold text-[#111111] transition-colors duration-150 group-hover:text-[#2f2a4c]">{post.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-[#4B5563]">{post.excerpt ?? "Откройте статью, чтобы прочитать материал."}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#6B7280]">
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5" />
                  {post.reading_time_min ?? 5} мин
                </span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {post.views_count}
                </span>
                <span>{post.published_at ? new Date(post.published_at).toLocaleDateString("ru-RU") : ""}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-3">
        <button
          type="button"
          onClick={() => {
            void fetchPage(Math.max(1, page - 1));
          }}
          disabled={loading || page <= 1}
          className={`rounded-xl border px-4 py-2 text-sm ${
            loading || page <= 1 ? "cursor-not-allowed border-[#E5E7EB] text-[#9CA3AF]" : "border-[#D1D5DB] text-[#111111] hover:border-[#4A4476] hover:text-[#4A4476]"
          }`}
        >
          Назад
        </button>
        <p className="text-sm text-[#374151]">
          {page} / {pageCount}
        </p>
        <button
          type="button"
          onClick={() => {
            void fetchPage(Math.min(pageCount, page + 1));
          }}
          disabled={loading || page >= pageCount}
          className={`rounded-xl border px-4 py-2 text-sm ${
            loading || page >= pageCount ? "cursor-not-allowed border-[#E5E7EB] text-[#9CA3AF]" : "border-[#D1D5DB] text-[#111111] hover:border-[#4A4476] hover:text-[#4A4476]"
          }`}
        >
          Вперед
        </button>
      </div>
    </div>
  );
}
