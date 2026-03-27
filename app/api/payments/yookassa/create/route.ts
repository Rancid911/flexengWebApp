import { NextRequest, NextResponse } from "next/server";

import { AdminHttpError, toErrorResponse } from "@/lib/admin/http";
import { createCheckoutForCurrentStudent } from "@/lib/payments/server";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { planId?: unknown };
    const planId = typeof body.planId === "string" ? body.planId.trim() : "";

    if (!planId) {
      throw new AdminHttpError(400, "PLAN_ID_REQUIRED", "planId is required");
    }

    const payload = await createCheckoutForCurrentStudent(planId);
    return NextResponse.json(payload);
  } catch (error) {
    return toErrorResponse(error);
  }
}
