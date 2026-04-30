import { defineDataLoadingDescriptor } from "@/lib/data-loading/contracts";
import type { AccessMode } from "@/lib/supabase/access";

export const SCHEDULE_QUERY_ACCESS_MODE: AccessMode = "privileged";

export const SCHEDULE_PAGE_DATA_LOADING = defineDataLoadingDescriptor({
  id: "schedule-page-data",
  owner: "@/lib/schedule/queries#getSchedulePageData",
  accessMode: SCHEDULE_QUERY_ACCESS_MODE,
  loadLevel: "page",
  shape: "aggregate",
  issues: ["mixed_responsibilities", "overfetch"],
  transitional: true,
  notes: [
    "Current page loader still couples lessons, option labels and filter metadata.",
    "Do not add unrelated concerns here; future boundaries are summary payload, filter catalog, preview/detail enrichment and mutation follow-up."
  ]
});

export const SCHEDULE_FILTER_CATALOG_DATA_LOADING = defineDataLoadingDescriptor({
  id: "schedule-filter-catalog",
  owner: "@/lib/schedule/queries#getScheduleFilterCatalog",
  accessMode: SCHEDULE_QUERY_ACCESS_MODE,
  loadLevel: "section",
  shape: "list",
  issues: []
});

export const STUDENT_SCHEDULE_PREVIEW_DATA_LOADING = defineDataLoadingDescriptor({
  id: "student-schedule-preview",
  owner: "@/lib/schedule/queries#getStudentSchedulePreviewByStudentId",
  accessMode: SCHEDULE_QUERY_ACCESS_MODE,
  loadLevel: "section",
  shape: "summary",
  issues: []
});
