import { NextRequest, NextResponse } from "next/server";

import { requireScheduleApi } from "@/lib/schedule/server";
import { ScheduleHttpError, withScheduleErrorHandling } from "@/lib/schedule/http";
import { studentBillingSettingsSchema } from "@/lib/billing/validation";
import { getBillingSummaryForActor, updateStudentBillingSettings } from "@/lib/billing/server";
import { requirePermission } from "@/lib/permissions";

export const GET = withScheduleErrorHandling(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireScheduleApi();
  const { id } = await params;
  requirePermission(actor, "billing.view", { studentId: id });
  const summary = await getBillingSummaryForActor(actor, id, 10);
  return NextResponse.json(summary);
});

export const PATCH = withScheduleErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireScheduleApi();
  const { id } = await params;
  requirePermission(actor, "billing.adjust", { studentId: id });
  const body = await request.json();
  const parsed = studentBillingSettingsSchema.safeParse(body);

  if (!parsed.success) {
    throw new ScheduleHttpError(400, "VALIDATION_ERROR", "Invalid billing settings payload", parsed.error.flatten());
  }

  const summary = await updateStudentBillingSettings(actor, id, {
    billingMode: parsed.data.billingMode ?? null,
    lessonPriceAmount: parsed.data.lessonPriceAmount ?? null
  });

  return NextResponse.json(summary);
});
