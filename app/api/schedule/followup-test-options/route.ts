import { NextRequest, NextResponse } from "next/server";

import { requirePermission } from "@/lib/permissions";
import { ScheduleHttpError, withScheduleErrorHandling } from "@/lib/schedule/http";
import { requireScheduleApi } from "@/lib/schedule/server";
import { listTeacherAssignableTests } from "@/lib/teacher-workspace/queries";

export const GET = withScheduleErrorHandling(async (request: NextRequest) => {
  const actor = await requireScheduleApi();
  requirePermission(actor, "schedule.followups.manage");
  const url = new URL(request.url);
  const studentId = url.searchParams.get("studentId");
  const includeAllLevels = url.searchParams.get("includeAllLevels") === "1";

  if (!studentId) {
    throw new ScheduleHttpError(400, "VALIDATION_ERROR", "studentId is required");
  }

  const result = await listTeacherAssignableTests(actor, studentId, { includeAllLevels });
  return NextResponse.json(result);
});
