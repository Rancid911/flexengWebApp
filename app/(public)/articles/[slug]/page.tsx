import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, Eye } from "lucide-react";
import { notFound } from "next/navigation";

import { BlogCoverImage } from "@/components/blog/blog-cover-image";
import { getBlogPostBySlug, getPublishedBlogPosts } from "@/lib/blog/public";
import { formatPublicDate } from "@/lib/dates/format-public-date";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getBlogPostBySlug(slug);

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
  const article = await getBlogPostBySlug(slug);
  if (!article) notFound();

  const relatedData = await getPublishedBlogPosts({
    page: 1,
    pageSize: 4,
    category: article.category?.slug ?? "",
    sort: "popular"
  });
  const related = relatedData.items.filter((item) => item.slug !== article.slug).slice(0, 3);

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
    <>
      <main className="w-full bg-white">
        <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
          <article className="rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs text-[#6B7280]">{article.category?.name ?? "Без категории"}</p>
            <h1 className="content-heading-balance mt-2 max-w-[18ch] text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">{article.title}</h1>
            <div className="blog-meta-row mt-4">
              <span>{article.author_name ?? "Редакция Флексенг"}</span>
              <span>{formatPublicDate(article.published_at)}</span>
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
              <div className="relative mt-6 h-64 overflow-hidden rounded-2xl">
                <BlogCoverImage
                  src={article.cover_image_url}
                  alt={article.title}
                  sizes="(min-width: 1024px) 896px, 100vw"
                  priority
                  className="object-cover"
                />
              </div>
            ) : null}

            <div className="article-prose content-measure mt-8 max-w-[68ch]">{article.content}</div>

            {article.tags.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/articles?tag=${encodeURIComponent(tag.slug)}`}
                    className="rounded-full border border-[#D1D5DB] px-3 py-1 text-xs text-[#374151] transition-[background-color,border-color,color,box-shadow] hover:border-[#4A4476] hover:bg-[#F3EFFA] hover:text-[#4A4476] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D70FF] focus-visible:ring-offset-2"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            ) : null}

          </article>

          {related.length > 0 ? (
            <section className="space-y-3">
              <h2 className="content-heading-balance max-w-[14ch] text-2xl font-semibold tracking-tight text-[#111111]">Похожие статьи</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {related.map((item) => (
                  <Link
                    key={item.id}
                    href={`/articles/${item.slug}`}
                    className="blog-card-surface blog-card-link group block p-4"
                  >
                    <p className="text-xs text-[#6B7280] transition-colors duration-150 group-hover:text-[#6B7280] group-focus-visible:text-[#6B7280]">{item.category?.name ?? "Без категории"}</p>
                    <h3 className="content-heading-balance mt-1 line-clamp-2 text-lg font-semibold tracking-tight text-[#111111] transition-colors duration-150 group-hover:text-[#2f2a4c] group-focus-visible:text-[#2f2a4c]">
                      {item.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#4B5563]">{item.excerpt ?? "Откройте статью"}</p>
                    <div className="blog-meta-row mt-3">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {item.reading_time_min ?? 5} мин
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {item.views_count}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
