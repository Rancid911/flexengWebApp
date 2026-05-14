import { notFound } from "next/navigation";

import { PracticeCatalog, practiceCatalogFilters } from "@/features/practice/components/practice-catalog";
import { PracticeFavoritesList, PracticeMistakesList } from "@/features/practice/components/practice-empty-list";
import { PracticeRecommended } from "@/features/practice/components/practice-recommended";
import { PracticeSubtopicDetail } from "@/features/practice/components/practice-subtopic-detail";
import { PracticeTopicDetail } from "@/features/practice/components/practice-topic-detail";
import { PracticeTopics } from "@/features/practice/components/practice-topics";
import {
  getPracticeActivityCatalog,
  getPracticeFavorites,
  getPracticeMistakes,
  getPracticeRecommended,
  getPracticeSubtopicDetail,
  getPracticeTopicDetail,
  getPracticeTopics,
  type PracticeCatalogFilter
} from "@/lib/practice/queries";

export async function renderPracticeCatalogRoute({ searchParams }: { searchParams?: Promise<{ filter?: string }> }) {
  const rawSearchParams = (await searchParams) ?? {};
  const filter = practiceCatalogFilters.some((item) => item.value === rawSearchParams.filter) ? (rawSearchParams.filter as PracticeCatalogFilter) : "all";
  const items = await getPracticeActivityCatalog(filter);

  return <PracticeCatalog filter={filter} items={items} />;
}

export async function renderPracticeRecommendedRoute() {
  const recommended = await getPracticeRecommended();

  return <PracticeRecommended recommended={recommended} />;
}

export async function renderPracticeTopicsRoute() {
  const topics = await getPracticeTopics();

  return <PracticeTopics topics={topics} />;
}

export async function renderPracticeTopicDetailRoute({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const payload = await getPracticeTopicDetail(topic);
  if (!payload) notFound();

  return <PracticeTopicDetail payload={payload} />;
}

export async function renderPracticeSubtopicDetailRoute({ params }: { params: Promise<{ topic: string; subtopic: string }> }) {
  const { topic, subtopic } = await params;
  const payload = await getPracticeSubtopicDetail(topic, subtopic);
  if (!payload) notFound();

  return <PracticeSubtopicDetail payload={payload} />;
}

export async function renderPracticeMistakesRoute() {
  const mistakes = await getPracticeMistakes();

  return <PracticeMistakesList mistakes={mistakes} />;
}

export async function renderPracticeFavoritesRoute() {
  const favorites = await getPracticeFavorites();

  return <PracticeFavoritesList favorites={favorites} />;
}
