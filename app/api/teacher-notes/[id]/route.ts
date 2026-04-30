import { NextRequest, NextResponse } from "next/server";

import { requireScheduleApi } from "@/lib/schedule/server";
import { ScheduleHttpError, withScheduleErrorHandling } from "@/lib/schedule/http";
import { teacherNoteMutationSchema } from "@/lib/teacher-workspace/validation";
import { deleteTeacherStudentNote, updateTeacherStudentNote } from "@/lib/teacher-workspace/queries";

export const PATCH = withScheduleErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireScheduleApi();
  const { id } = await params;
  const body = await request.json();
  const parsed = teacherNoteMutationSchema.safeParse(body);

  if (!parsed.success) {
    throw new ScheduleHttpError(400, "VALIDATION_ERROR", "Invalid teacher note payload", parsed.error.flatten());
  }

  const result = await updateTeacherStudentNote(actor, id, parsed.data);
  return NextResponse.json(result);
});

export const DELETE = withScheduleErrorHandling(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireScheduleApi();
  const { id } = await params;
  const result = await deleteTeacherStudentNote(actor, id);
  return NextResponse.json(result);
});
