import type { Metadata } from "next";

import type { BlogCategoryDto, BlogPostCardDto, BlogTagDto, PaginatedResponse } from "@/lib/admin/types";
import { MainHeader } from "@/app/main/main-header";
import { MainFooter } from "@/app/main/main-footer";
import { BlogLiveSearchShell } from "@/app/articles/blog-live-search-shell";
import { getRequestOrigin } from "@/lib/server-origin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Блог Флексенг — статьи для изучающих английский",
  description: "Практические статьи по грамматике, разговорному английскому, работе и путешествиям."
};

const navItems = [
  { href: "/#programs", label: "Программы" },
  { href: "/#teachers", label: "Преподаватели" },
  { href: "/#pricing", label: "Стоимость" }
];

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const origin = await getRequestOrigin();
    const response = await fetch(new URL(path, origin), { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export default async function BlogPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; category?: string; tag?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const category = (params.category ?? "").trim();
  const tag = (params.tag ?? "").trim();
  const sort = (params.sort ?? "new").trim() === "popular" ? "popular" : "new";
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const perPage = 5;

  const editorialData = await fetchJson<PaginatedResponse<BlogPostCardDto>>(`/api/blog/posts?page=1&pageSize=3&sort=popular`);
  const postsData = await fetchJson<PaginatedResponse<BlogPostCardDto>>(
    `/api/blog/posts?page=${page}&pageSize=${perPage}&q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}&tag=${encodeURIComponent(tag)}&sort=${sort}`
  );
  const metaData = await fetchJson<{ categories: BlogCategoryDto[]; tags: BlogTagDto[]; popular: Array<{ id: string; slug: string; title: string; views_count: number }> }>(
    "/api/blog/meta"
  );

  const editorial = editorialData?.items ?? [];
  const posts = postsData?.items ?? [];
  const total = postsData?.total ?? 0;
  const pageSize = postsData?.pageSize ?? perPage;
  const categories = metaData?.categories ?? [];
  const tags = metaData?.tags ?? [];
  const popular = metaData?.popular ?? [];

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-white">
      <MainHeader navItems={navItems} />

      <main className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <BlogLiveSearchShell
          categories={categories}
          tags={tags}
          popular={popular}
          editorial={editorial}
          initialItems={posts}
          initialPage={page}
          initialPageCount={pageCount}
          initialTotal={total}
          pageSize={pageSize}
          initialQ={q}
          initialCategory={category}
          initialTag={tag}
          initialSort={sort}
        />
      </main>
      <MainFooter leadHref="/#lead-form" />
    </div>
  );
}
