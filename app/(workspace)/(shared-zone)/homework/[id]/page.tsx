import { renderHomeworkDetailRoute } from "@/features/homework/server/homework-routes";
import { requireWorkspaceRouteAccess } from "@/lib/auth/rbac-route-guard";

export default async function HomeworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireWorkspaceRouteAccess("homework");
  return renderHomeworkDetailRoute({ params });
}
