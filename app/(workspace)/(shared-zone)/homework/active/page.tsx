import { renderHomeworkActiveRoute } from "@/features/homework/server/homework-routes";
import { requireWorkspaceRouteAccess } from "@/lib/auth/rbac-route-guard";

export default async function HomeworkActivePage() {
  await requireWorkspaceRouteAccess("homework");
  return renderHomeworkActiveRoute();
}
