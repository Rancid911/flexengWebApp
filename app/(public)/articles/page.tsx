import type { Metadata } from "next";

import { renderBlogIndexRoute } from "@/features/blog/server/blog-routes";

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
  return renderBlogIndexRoute({ searchParams });
}
