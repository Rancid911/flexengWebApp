import { NextRequest, NextResponse } from "next/server";

import { createCheckoutForCurrentStudent } from "@/lib/payments/server";
import { HttpError, withApiErrorHandling } from "@/lib/server/http";

export const POST = withApiErrorHandling(async (request: NextRequest) => {
    const body = (await request.json().catch(() => ({}))) as { planId?: unknown };
    const planId = typeof body.planId === "string" ? body.planId.trim() : "";

    if (!planId) {
      throw new HttpError(400, "PLAN_ID_REQUIRED", "planId is required");
    }

    const payload = await createCheckoutForCurrentStudent(planId);
    return NextResponse.json(payload);
});
