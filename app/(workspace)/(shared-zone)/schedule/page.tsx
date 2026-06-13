import { renderScheduleRoute } from "@/features/schedule/server/schedule-route";
import { requireWorkspaceRouteAccess } from "@/lib/auth/rbac-route-guard";

export default async function SchedulePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireWorkspaceRouteAccess("schedule");
  return renderScheduleRoute({ searchParams });
}
