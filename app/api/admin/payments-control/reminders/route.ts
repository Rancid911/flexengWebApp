import { NextRequest, NextResponse } from "next/server";

import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { requireStaffAdminApi } from "@/lib/admin/auth";
import { sendStudentPaymentReminder } from "@/lib/admin/payments-control";

export const POST = withAdminErrorHandling(async (request: NextRequest) => {
  const actor = await requireStaffAdminApi();
  const body = (await request.json().catch(() => null)) as { studentId?: unknown } | null;
  const studentId = typeof body?.studentId === "string" ? body.studentId.trim() : "";
  if (!studentId) {
    throw new AdminHttpError(400, "VALIDATION_ERROR", "Student id is required");
  }

  const payload = await sendStudentPaymentReminder(actor, studentId);
  return NextResponse.json(payload);
});
