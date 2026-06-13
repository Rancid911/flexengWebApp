import { renderWordsOverviewRoute } from "@/features/words/server/words-overview-routes";
import { requireWorkspaceRouteAccess } from "@/lib/auth/rbac-route-guard";

export default async function WordsPage() {
  await requireWorkspaceRouteAccess("words");
  return renderWordsOverviewRoute();
}
