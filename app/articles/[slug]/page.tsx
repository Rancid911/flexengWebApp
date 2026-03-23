import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, Eye } from "lucide-react";
import { notFound } from "next/navigation";

import type { BlogPostCardDto, BlogPostDetailDto, PaginatedResponse } from "@/lib/admin/types";
import { MainHeader } from "@/app/main/main-header";
import { MainFooter } from "@/app/main/main-footer";
import { getRequestOrigin } from "@/lib/server-origin";

export const dynamic = "force-dynamic";

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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchJson<BlogPostDetailDto>(`/api/blog/posts/${slug}`);

  if (!article) {
    return {
      title: "Статья не найдена",
      description: "Материал недоступен или находится в разработке"
    };
  }

  const title = article.seo_title ?? article.title;
  const description = article.seo_description ?? article.excerpt ?? "Практический материал для изучающих английский язык";

  return {
    title,
    description,
    alternates: {
      canonical: `/articles/${article.slug}`
    },
    openGraph: {
      title,
      description,
      type: "article"
    }
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await fetchJson<BlogPostDetailDto>(`/api/blog/posts/${slug}`);
  if (!article) notFound();

  const relatedData = await fetchJson<PaginatedResponse<BlogPostCardDto>>(`/api/blog/posts?page=1&pageSize=4&category=${encodeURIComponent(article.category?.slug ?? "")}&sort=popular`);
  const relatedFromApi = (relatedData?.items ?? []).filter((item) => item.slug !== article.slug).slice(0, 3);
  const related = relatedFromApi;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    datePublished: article.published_at,
    dateModified: article.updated_at,
    author: {
      "@type": "Person",
      name: article.author_name ?? "Редакция Флексенг"
    },
    description: article.seo_description ?? article.excerpt,
    image: article.cover_image_url ?? undefined
  };

  return (
    <div className="min-h-screen bg-white">
      <MainHeader navItems={navItems} />
      <main className="mx-auto w-full max-w-4xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <article className="rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs text-[#6B7280]">{article.category?.name ?? "Без категории"}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">{article.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#6B7280]">
            <span>{article.author_name ?? "Редакция Флексенг"}</span>
            <span>{article.published_at ? new Date(article.published_at).toLocaleDateString("ru-RU") : ""}</span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              {article.reading_time_min ?? 5} мин
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {article.views_count}
            </span>
          </div>

          {article.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={article.cover_image_url} alt={article.title} className="mt-6 h-64 w-full rounded-2xl object-cover" />
          ) : null}

          <div className="prose prose-slate mt-6 max-w-none whitespace-pre-wrap text-[#374151]">{article.content}</div>

          {article.tags.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/articles?tag=${encodeURIComponent(tag.slug)}`}
                  className="rounded-full border border-[#D1D5DB] px-3 py-1 text-xs text-[#374151] transition hover:border-[#4A4476] hover:bg-[#F3EFFA] hover:text-[#4A4476]"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          ) : null}

        </article>

        {related.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-[#111111]">Похожие статьи</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/articles/${item.slug}`}
                  className="group rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm transition hover:border-[#322F55] hover:bg-[#4A4476] hover:shadow-md"
                >
                  <p className="text-xs text-[#6B7280] transition group-hover:text-white">{item.category?.name ?? "Без категории"}</p>
                  <h3 className="mt-1 line-clamp-2 text-base font-semibold text-[#111111] transition group-hover:text-white">{item.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-[#4B5563] transition group-hover:text-white">{item.excerpt ?? "Откройте статью"}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <MainFooter leadHref="/#lead-form" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
