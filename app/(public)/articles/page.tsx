import type { Metadata } from "next";

import { BlogLiveSearchShell } from "@/app/(public)/articles/blog-live-search-shell";
import { getBlogMeta, getPublishedBlogPosts } from "@/lib/blog/public";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Блог Флексенг — статьи для изучающих английский",
  description: "Практические статьи по грамматике, разговорному английскому, работе и путешествиям."
};

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

  const [editorialData, postsData, metaData] = await Promise.all([
    getPublishedBlogPosts({ page: 1, pageSize: 3, sort: "popular" }),
    getPublishedBlogPosts({ page, pageSize: perPage, q, category, tag, sort }),
    getBlogMeta()
  ]);

  const editorial = editorialData.items;
  const posts = postsData.items;
  const total = postsData.total;
  const pageSize = postsData.pageSize;
  const categories = metaData.categories;
  const tags = metaData.tags;
  const popular = metaData.popular;

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="w-full bg-white">
      <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <BlogLiveSearchShell
          categories={categories}
          tags={tags}
          popular={popular}
          editorial={editorial}
          initialItems={posts}
          initialPage={page}
          initialPageCount={pageCount}
          initialQ={q}
          initialCategory={category}
          initialTag={tag}
          initialSort={sort}
        />
      </div>
    </main>
  );
}
