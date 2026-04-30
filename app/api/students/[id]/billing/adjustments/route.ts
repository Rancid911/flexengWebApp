import { NextRequest, NextResponse } from "next/server";

import { createStudentBillingAdjustment } from "@/lib/billing/server";
import { studentBillingAdjustmentSchema } from "@/lib/billing/validation";
import { ScheduleHttpError, withScheduleErrorHandling } from "@/lib/schedule/http";
import { requireScheduleApi } from "@/lib/schedule/server";

export const POST = withScheduleErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireScheduleApi();
  const { id } = await params;
  const body = await request.json();
  const parsed = studentBillingAdjustmentSchema.safeParse(body);

  if (!parsed.success) {
    throw new ScheduleHttpError(400, "VALIDATION_ERROR", "Invalid billing adjustment payload", parsed.error.flatten());
  }

  const summary = await createStudentBillingAdjustment(actor, id, {
    unitType: parsed.data.unitType,
    direction: parsed.data.direction,
    value: parsed.data.value,
    description: parsed.data.description ?? null
  });

  return NextResponse.json(summary, { status: 201 });
});
