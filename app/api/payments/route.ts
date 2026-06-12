import { NextRequest, NextResponse } from "next/server";

import { getAppActor } from "@/lib/auth/request-context";
import { getCurrentStudentBillingSummary } from "@/lib/billing/server";
import { getStudentPayments } from "@/lib/payments/payments.service";
import { requirePermission } from "@/lib/permissions";
import { HttpError, withApiErrorHandling } from "@/lib/server/http";

export const GET = withApiErrorHandling(async (request: NextRequest) => {
  const actor = await getAppActor();
  if (!actor) {
    throw new HttpError(401, "UNAUTHORIZED", "Authentication required");
  }
  requirePermission(actor, "payments.view");

  const url = new URL(request.url);
  const includePayments = url.searchParams.get("includePayments") !== "0";
  const includeBillingSummary = url.searchParams.get("includeBillingSummary") !== "0";

  const [payments, billingSummary] = await Promise.all([
    includePayments ? getStudentPayments() : Promise.resolve([]),
    includeBillingSummary
      ? getCurrentStudentBillingSummary(6).catch((error) => {
          console.warn("PAYMENTS_API_BILLING_SUMMARY_FAILED", error);
          return null;
        })
      : Promise.resolve(null)
  ]);

  return NextResponse.json({ payments, billingSummary });
});
