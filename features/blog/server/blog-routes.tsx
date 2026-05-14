import { notFound } from "next/navigation";

import { BlogArticleView } from "@/features/blog/components/blog-article-view";
import { BlogLiveSearchShell } from "@/features/blog/components/blog-live-search-shell";
import { getBlogMeta, getBlogPostBySlug, getPublishedBlogPosts } from "@/lib/blog/public";

type BlogIndexRouteProps = {
  searchParams: Promise<{ q?: string; category?: string; tag?: string; sort?: string; page?: string }>;
};

type BlogArticleRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function renderBlogIndexRoute({ searchParams }: BlogIndexRouteProps) {
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

export async function renderBlogArticleRoute({ params }: BlogArticleRouteProps) {
  const { slug } = await params;
  const article = await getBlogPostBySlug(slug);
  if (!article) notFound();

  const relatedData = await getPublishedBlogPosts({
    page: 1,
    pageSize: 4,
    category: article.category?.slug ?? "",
    sort: "popular"
  });
  const related = relatedData.items.filter((item) => item.slug !== article.slug).slice(0, 3);

  return <BlogArticleView article={article} related={related} />;
}
