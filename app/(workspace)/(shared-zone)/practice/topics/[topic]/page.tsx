import { renderPracticeTopicDetailRoute } from "@/features/practice/server/practice-library-routes";

export default async function PracticeTopicDetailPage({ params }: { params: Promise<{ topic: string }> }) {
  return renderPracticeTopicDetailRoute({ params });
}
