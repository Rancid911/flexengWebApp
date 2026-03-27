import { getSchedulePageData } from "@/lib/schedule/queries";
import { requireSchedulePage } from "@/lib/schedule/server";

import { ScheduleClient } from "./schedule-client";

export default async function SchedulePage() {
  const actor = await requireSchedulePage();
  const initialData = await getSchedulePageData(actor);

  return <ScheduleClient initialData={initialData} />;
}
