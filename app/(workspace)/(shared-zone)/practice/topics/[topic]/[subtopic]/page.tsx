import { renderPracticeSubtopicDetailRoute } from "@/features/practice/server/practice-library-routes";

export default async function PracticeSubtopicDetailPage({ params }: { params: Promise<{ topic: string; subtopic: string }> }) {
  return renderPracticeSubtopicDetailRoute({ params });
}
