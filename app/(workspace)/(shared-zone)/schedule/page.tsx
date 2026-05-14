import { renderScheduleRoute } from "@/features/schedule/server/schedule-route";

export default async function SchedulePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return renderScheduleRoute({ searchParams });
}
