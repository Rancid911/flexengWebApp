import { getSchedulePageDataInternal } from "@/lib/schedule/queries";
import { requireSchedulePage } from "@/lib/schedule/server";
import { measureServerTiming } from "@/lib/server/timing";
import { scheduleFiltersSchema } from "@/lib/schedule/validation";

import { ScheduleClient } from "./schedule-client";

export default async function SchedulePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [actor, rawSearchParams] = await Promise.all([
    measureServerTiming("schedule-route-context", () => requireSchedulePage()),
    searchParams
  ]);
  const parsedFilters = scheduleFiltersSchema.safeParse({
    studentId: typeof rawSearchParams.studentId === "string" ? rawSearchParams.studentId : null,
    teacherId: typeof rawSearchParams.teacherId === "string" ? rawSearchParams.teacherId : null,
    status: typeof rawSearchParams.status === "string" ? rawSearchParams.status : null,
    dateFrom: typeof rawSearchParams.dateFrom === "string" ? rawSearchParams.dateFrom : null,
    dateTo: typeof rawSearchParams.dateTo === "string" ? rawSearchParams.dateTo : null
  });
  const initialData = await measureServerTiming("schedule-route-data", () =>
    getSchedulePageDataInternal(actor, parsedFilters.success ? parsedFilters.data : {}, {
      includeFollowup: actor.role === "student"
    })
  );

  return <ScheduleClient initialData={initialData} />;
}
