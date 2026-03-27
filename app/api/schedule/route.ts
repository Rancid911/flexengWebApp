import { NextRequest, NextResponse } from "next/server";

import { getSchedulePageData, createScheduleLesson } from "@/lib/schedule/queries";
import { requireScheduleApi } from "@/lib/schedule/server";
import { withScheduleErrorHandling, ScheduleHttpError } from "@/lib/schedule/http";
import { scheduleFiltersSchema, scheduleLessonMutationSchema } from "@/lib/schedule/validation";

export const GET = withScheduleErrorHandling(async (request: NextRequest) => {
  const actor = await requireScheduleApi();

  const parsed = scheduleFiltersSchema.safeParse({
    studentId: request.nextUrl.searchParams.get("studentId"),
    teacherId: request.nextUrl.searchParams.get("teacherId"),
    status: request.nextUrl.searchParams.get("status"),
    dateFrom: request.nextUrl.searchParams.get("dateFrom"),
    dateTo: request.nextUrl.searchParams.get("dateTo")
  });

  if (!parsed.success) {
    throw new ScheduleHttpError(400, "VALIDATION_ERROR", "Invalid schedule filters", parsed.error.flatten());
  }

  const data = await getSchedulePageData(actor, parsed.data);
  return NextResponse.json(data);
});

export const POST = withScheduleErrorHandling(async (request: NextRequest) => {
  const actor = await requireScheduleApi();
  const body = await request.json();
  const parsed = scheduleLessonMutationSchema.safeParse(body);

  if (!parsed.success) {
    throw new ScheduleHttpError(400, "VALIDATION_ERROR", "Invalid lesson payload", parsed.error.flatten());
  }

  const lesson = await createScheduleLesson(actor, parsed.data);
  return NextResponse.json(lesson, { status: 201 });
});
