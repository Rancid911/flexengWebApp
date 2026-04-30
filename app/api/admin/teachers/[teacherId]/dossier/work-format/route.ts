import { NextRequest, NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { updateTeacherWorkFormat } from "@/lib/admin/teacher-dossier.service";
import { teacherWorkFormatUpdateSchema } from "@/lib/admin/validation";

export const PATCH = withAdminErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ teacherId: string }> }) => {
  const actor = await requireStaffAdminApi();
  const { teacherId } = await params;
  const body = await request.json();
  const parsed = teacherWorkFormatUpdateSchema.safeParse(body);

  if (!parsed.success) {
    throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid teacher work format payload", parsed.error.flatten());
  }

  const payload = await updateTeacherWorkFormat(actor, teacherId, parsed.data);
  return NextResponse.json(payload);
});
