import { notFound } from "next/navigation";

import { WordTopicDetail } from "@/features/words/components/word-topic-detail";
import { WordsOverview } from "@/features/words/components/words-overview";
import { getWordTopicDetail, getWordTopicSummaries, getWordsOverviewSummary } from "@/lib/words/queries";

export async function renderWordsOverviewRoute() {
  const [summary, topics] = await Promise.all([getWordsOverviewSummary(), getWordTopicSummaries()]);

  return <WordsOverview summary={summary} topics={topics} />;
}

export async function renderWordTopicRoute({ params }: { params: Promise<{ topicSlug: string }> }) {
  const { topicSlug } = await params;
  const detail = await getWordTopicDetail(topicSlug);
  if (!detail) notFound();

  return <WordTopicDetail detail={detail} />;
}
