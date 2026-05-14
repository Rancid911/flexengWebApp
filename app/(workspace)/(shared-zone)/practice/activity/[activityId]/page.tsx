import { renderPracticeActivityRoute } from "@/features/practice/server/practice-activity-route";

export default async function PracticeActivityPage({ params }: { params: Promise<{ activityId: string }> }) {
  return renderPracticeActivityRoute({ params });
}
