import { renderWordTopicRoute } from "@/features/words/server/words-overview-routes";
import { requireWorkspaceRouteAccess } from "@/lib/auth/rbac-route-guard";

export default async function WordTopicPage({ params }: { params: Promise<{ topicSlug: string }> }) {
  await requireWorkspaceRouteAccess("words");
  return renderWordTopicRoute({ params });
}
