import { renderWordsDifficultRoute } from "@/features/words/server/words-list-routes";
import { requireWorkspaceRouteAccess } from "@/lib/auth/rbac-route-guard";

export default async function WordsDifficultPage() {
  await requireWorkspaceRouteAccess("words");
  return renderWordsDifficultRoute();
}
