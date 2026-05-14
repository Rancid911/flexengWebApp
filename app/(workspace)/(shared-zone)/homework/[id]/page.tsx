import { renderHomeworkDetailRoute } from "@/features/homework/server/homework-routes";

export default async function HomeworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return renderHomeworkDetailRoute({ params });
}
