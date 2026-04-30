import { NextRequest, NextResponse, after } from "next/server";

import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { requireStaffAdminApi } from "@/lib/admin/auth";
import { getAdminPaymentReminderSettings, syncAutomaticPaymentReminders, updateAdminPaymentReminderSettings } from "@/lib/admin/payments-control";

export const GET = withAdminErrorHandling(async () => {
  await requireStaffAdminApi();
  const settings = await getAdminPaymentReminderSettings();
  return NextResponse.json(settings);
});

export const PATCH = withAdminErrorHandling(async (request: NextRequest) => {
  const actor = await requireStaffAdminApi();
  const body = (await request.json().catch(() => null)) as { enabled?: unknown; threshold_lessons?: unknown } | null;
  const enabled = typeof body?.enabled === "boolean" ? body.enabled : null;
  const thresholdLessons =
    typeof body?.threshold_lessons === "number" && Number.isFinite(body.threshold_lessons)
      ? Math.max(0, Math.floor(body.threshold_lessons))
      : null;

  if (enabled == null || thresholdLessons == null) {
    throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid reminder settings payload");
  }

  const settings = await updateAdminPaymentReminderSettings(actor, {
    enabled,
    threshold_lessons: thresholdLessons
  });

  after(async () => {
    try {
      await syncAutomaticPaymentReminders(actor, {
        enabled,
        threshold_lessons: thresholdLessons
      });
    } catch (error) {
      console.error("[admin-payment-reminder-sync]", error);
    }
  });

  return NextResponse.json(settings);
});
