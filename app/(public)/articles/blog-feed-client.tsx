"use client";

import Link from "next/link";
import { Clock3, Eye } from "lucide-react";

import type { BlogPostCardDto } from "@/lib/admin/types";
import { formatPublicDate } from "@/lib/dates/format-public-date";

type BlogFeedClientProps = {
  items: BlogPostCardDto[];
  page: number;
  pageCount: number;
  buildPageHref: (nextPage: number) => string;
};

export function BlogFeedClient({
  items,
  page,
  pageCount,
    buildPageHref
}: BlogFeedClientProps) {
  return (
    <div className="space-y-3">
      <h2 className="content-heading-balance max-w-[12ch] text-2xl font-semibold tracking-tight text-[#111111]">Все статьи</h2>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 text-sm text-[#4B5563]">Пока статей по выбранным фильтрам нет.</div>
      ) : (
        <div className="grid gap-3">
          {items.map((post, index) => (
            <Link
              key={`${post.id || post.slug || "post"}-${index}`}
              href={`/articles/${post.slug}`}
              className="blog-card-surface blog-card-link group block p-4"
            >
              <p className="text-xs text-[#6B7280]">{post.category?.name ?? "Без категории"}</p>
              <h3 className="content-heading-balance mt-1 max-w-[24ch] text-lg font-semibold tracking-tight text-[#111111] transition-colors duration-150 group-hover:text-[#2f2a4c] group-focus-visible:text-[#2f2a4c]">
                {post.title}
              </h3>
              <p className="mt-2 line-clamp-2 max-w-[62ch] text-sm leading-6 text-[#4B5563]">{post.excerpt ?? "Откройте статью, чтобы прочитать материал."}</p>
              <div className="blog-meta-row mt-3">
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5" />
                  {post.reading_time_min ?? 5} мин
                </span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {post.views_count}
                </span>
                <span>{formatPublicDate(post.published_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-3">
        <Link
          href={buildPageHref(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          tabIndex={page <= 1 ? -1 : 0}
          className={`rounded-xl border px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D70FF] focus-visible:ring-offset-2 ${
            page <= 1 ? "pointer-events-none cursor-not-allowed border-[#E5E7EB] text-[#9CA3AF]" : "border-[#D1D5DB] text-[#111111] hover:border-[#4A4476] hover:text-[#4A4476]"
          }`}
        >
          Назад
        </Link>
        <p className="text-sm text-[#374151]">
          {page} / {pageCount}
        </p>
        <Link
          href={buildPageHref(Math.min(pageCount, page + 1))}
          aria-disabled={page >= pageCount}
          tabIndex={page >= pageCount ? -1 : 0}
          className={`rounded-xl border px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D70FF] focus-visible:ring-offset-2 ${
            page >= pageCount ? "pointer-events-none cursor-not-allowed border-[#E5E7EB] text-[#9CA3AF]" : "border-[#D1D5DB] text-[#111111] hover:border-[#4A4476] hover:text-[#4A4476]"
          }`}
        >
          Вперед
        </Link>
      </div>
    </div>
  );
}
