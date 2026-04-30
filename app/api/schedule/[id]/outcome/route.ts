import { NextRequest, NextResponse } from "next/server";

import { requireScheduleApi } from "@/lib/schedule/server";
import { ScheduleHttpError, withScheduleErrorHandling } from "@/lib/schedule/http";
import { getTeacherLessonFollowup, upsertTeacherLessonFollowup } from "@/lib/teacher-workspace/queries";
import { teacherLessonFollowupSchema } from "@/lib/teacher-workspace/validation";

export const GET = withScheduleErrorHandling(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireScheduleApi();
  const { id } = await params;
  const result = await getTeacherLessonFollowup(actor, id);
  return NextResponse.json(result);
});

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

export const PATCH = POST;
