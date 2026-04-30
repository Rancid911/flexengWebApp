import { NextRequest, NextResponse } from "next/server";

import { requireScheduleApi } from "@/lib/schedule/server";
import { ScheduleHttpError, withScheduleErrorHandling } from "@/lib/schedule/http";
import { teacherLessonFollowupSchema } from "@/lib/teacher-workspace/validation";
import { upsertTeacherLessonFollowup } from "@/lib/teacher-workspace/queries";

export const POST = withScheduleErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireScheduleApi();
  const { id } = await params;
  const body = await request.json();
  const parsed = teacherLessonFollowupSchema.safeParse(body);

  if (!parsed.success) {
    throw new ScheduleHttpError(400, "VALIDATION_ERROR", "Invalid lesson follow-up payload", parsed.error.flatten());
  }

  const result = await upsertTeacherLessonFollowup(actor, id, parsed.data);
  return NextResponse.json(result);
});
