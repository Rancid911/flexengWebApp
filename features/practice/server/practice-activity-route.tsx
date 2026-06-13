import { notFound } from "next/navigation";

import { PracticeActivityContent } from "@/features/practice/components/practice-activity-content";
import { getPracticeActivityDetail } from "@/lib/practice/queries";

export async function renderPracticeActivityRoute({ params }: { params: Promise<{ activityId: string }> }) {
  const { activityId } = await params;
  const payload = await getPracticeActivityDetail(activityId);
  if (!payload) notFound();

  return <PracticeActivityContent payload={payload} />;
}
