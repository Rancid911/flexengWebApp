import { renderWordTopicRoute } from "@/features/words/server/words-overview-routes";

export default async function WordTopicPage({ params }: { params: Promise<{ topicSlug: string }> }) {
  return renderWordTopicRoute({ params });
}
