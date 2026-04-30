import { NextRequest, NextResponse } from "next/server";

import { requireScheduleApi } from "@/lib/schedule/server";
import { ScheduleHttpError, withScheduleErrorHandling } from "@/lib/schedule/http";
import { createTeacherStudentNote } from "@/lib/teacher-workspace/queries";
import { teacherNoteMutationSchema } from "@/lib/teacher-workspace/validation";

export const POST = withScheduleErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireScheduleApi();
  const { id } = await params;
  const body = await request.json();
  const parsed = teacherNoteMutationSchema.safeParse(body);

  if (!parsed.success) {
    throw new ScheduleHttpError(400, "VALIDATION_ERROR", "Invalid teacher note payload", parsed.error.flatten());
  }

  const result = await createTeacherStudentNote(actor, id, parsed.data);
  return NextResponse.json(result, { status: 201 });
});
