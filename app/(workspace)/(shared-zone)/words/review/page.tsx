import { renderWordsReviewRoute } from "@/features/words/server/words-list-routes";
import { requireWorkspaceRouteAccess } from "@/lib/auth/rbac-route-guard";

export default async function WordsReviewPage() {
  await requireWorkspaceRouteAccess("words");
  return renderWordsReviewRoute();
}
