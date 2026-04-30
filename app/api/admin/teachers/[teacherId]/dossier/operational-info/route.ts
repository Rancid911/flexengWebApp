import { NextRequest, NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { updateTeacherOperationalInfo } from "@/lib/admin/teacher-dossier.service";
import { teacherOperationalInfoUpdateSchema } from "@/lib/admin/validation";

export const PATCH = withAdminErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ teacherId: string }> }) => {
  const actor = await requireStaffAdminApi();
  const { teacherId } = await params;
  const body = await request.json();
  const parsed = teacherOperationalInfoUpdateSchema.safeParse(body);

  if (!parsed.success) {
    throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid teacher operational info payload", parsed.error.flatten());
  }

  const payload = await updateTeacherOperationalInfo(actor, teacherId, parsed.data);
  return NextResponse.json(payload);
});
