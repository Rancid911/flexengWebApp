import { NextRequest, NextResponse } from "next/server";

import { cancelScheduleLesson, updateScheduleLesson } from "@/lib/schedule/queries";
import { ScheduleHttpError, withScheduleErrorHandling } from "@/lib/schedule/http";
import { requireScheduleApi } from "@/lib/schedule/server";
import { scheduleLessonUpdateSchema } from "@/lib/schedule/validation";

export const PATCH = withScheduleErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireScheduleApi();
  const { id } = await params;
  const body = await request.json();
  const parsed = scheduleLessonUpdateSchema.safeParse(body);

  if (!parsed.success) {
    throw new ScheduleHttpError(400, "VALIDATION_ERROR", "Invalid lesson payload", parsed.error.flatten());
  }

  const lesson = await updateScheduleLesson(actor, id, parsed.data);
  return NextResponse.json(lesson);
});

export const DELETE = withScheduleErrorHandling(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireScheduleApi();
  const { id } = await params;
  const lesson = await cancelScheduleLesson(actor, id);
  return NextResponse.json(lesson);
});
