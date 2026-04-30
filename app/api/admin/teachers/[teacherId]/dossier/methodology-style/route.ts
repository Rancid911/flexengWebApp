import { NextRequest, NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { updateTeacherMethodologyStyle } from "@/lib/admin/teacher-dossier.service";
import { teacherMethodologyStyleUpdateSchema } from "@/lib/admin/validation";

export const PATCH = withAdminErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ teacherId: string }> }) => {
  const actor = await requireStaffAdminApi();
  const { teacherId } = await params;
  const body = await request.json();
  const parsed = teacherMethodologyStyleUpdateSchema.safeParse(body);

  if (!parsed.success) {
    throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid teacher methodology style payload", parsed.error.flatten());
  }

  const payload = await updateTeacherMethodologyStyle(actor, teacherId, parsed.data);
  return NextResponse.json(payload);
});
