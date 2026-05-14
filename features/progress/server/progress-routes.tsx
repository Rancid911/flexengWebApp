import { ProgressHistory } from "@/features/progress/components/progress-history";
import { ProgressOverview } from "@/features/progress/components/progress-overview";
import { ProgressTopics } from "@/features/progress/components/progress-topics";
import { ProgressWeakPoints } from "@/features/progress/components/progress-weak-points";
import { getProgressByTopics, getProgressHistory, getProgressOverview, getWeakPoints } from "@/lib/progress/queries";
import { measureServerTiming } from "@/lib/server/timing";

export async function renderProgressOverviewRoute() {
  const overview = await measureServerTiming("progress-overview-route-data", () => getProgressOverview());
  return <ProgressOverview overview={overview} />;
}

export async function renderProgressTopicsRoute() {
  const topics = await measureServerTiming("progress-topics-route-data", () => getProgressByTopics());
  return <ProgressTopics topics={topics} />;
}

export async function renderProgressHistoryRoute() {
  const history = await getProgressHistory();
  return <ProgressHistory history={history} />;
}

export async function renderProgressWeakPointsRoute() {
  const weakPoints = await getWeakPoints();
  return <ProgressWeakPoints weakPoints={weakPoints} />;
}
