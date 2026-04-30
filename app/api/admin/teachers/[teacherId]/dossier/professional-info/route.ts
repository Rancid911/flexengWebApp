import { NextRequest, NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { updateTeacherProfessionalInfo } from "@/lib/admin/teacher-dossier.service";
import { teacherProfessionalInfoUpdateSchema } from "@/lib/admin/validation";

export const PATCH = withAdminErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ teacherId: string }> }) => {
  const actor = await requireStaffAdminApi();
  const { teacherId } = await params;
  const body = await request.json();
  const parsed = teacherProfessionalInfoUpdateSchema.safeParse(body);

  if (!parsed.success) {
    throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid teacher professional info payload", parsed.error.flatten());
  }

  const payload = await updateTeacherProfessionalInfo(actor, teacherId, parsed.data);
  return NextResponse.json(payload);
});
