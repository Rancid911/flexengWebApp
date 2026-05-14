import type { Metadata } from "next";

import { renderBlogArticleRoute } from "@/features/blog/server/blog-routes";
import { getBlogPostBySlug } from "@/lib/blog/public";

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
  return renderBlogArticleRoute({ params });
}
