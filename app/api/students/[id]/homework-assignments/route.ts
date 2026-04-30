import { NextRequest, NextResponse } from "next/server";

import { ScheduleHttpError, withScheduleErrorHandling } from "@/lib/schedule/http";
import { requireScheduleApi } from "@/lib/schedule/server";
import { createTeacherStudentStandaloneHomework, listTeacherStudentStandaloneHomework } from "@/lib/teacher-workspace/queries";
import { teacherStandaloneHomeworkCreateSchema } from "@/lib/teacher-workspace/validation";

export const GET = withScheduleErrorHandling(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireScheduleApi();
  const { id } = await params;
  const result = await listTeacherStudentStandaloneHomework(actor, id);
  return NextResponse.json(result);
});

export const POST = withScheduleErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireScheduleApi();
  const { id } = await params;
  const parsed = teacherStandaloneHomeworkCreateSchema.safeParse(await request.json());
  if (!parsed.success) {
    throw new ScheduleHttpError(400, "VALIDATION_ERROR", "Некорректные данные для назначения homework.", parsed.error.flatten());
  }

  const result = await createTeacherStudentStandaloneHomework(actor, id, parsed.data);
  return NextResponse.json(result, { status: 201 });
});
