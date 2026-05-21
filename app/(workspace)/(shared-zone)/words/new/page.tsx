import { renderWordsNewRoute } from "@/features/words/server/words-list-routes";
import { requireWorkspaceRouteAccess } from "@/lib/auth/rbac-route-guard";

export default async function WordsNewPage() {
  await requireWorkspaceRouteAccess("words");
  return renderWordsNewRoute();
}
