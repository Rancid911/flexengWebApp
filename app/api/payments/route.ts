import { NextRequest, NextResponse } from "next/server";

import { getCurrentStudentBillingSummary } from "@/lib/billing/server";
import { getStudentPayments } from "@/lib/payments/queries";

export async function GET(request: NextRequest) {
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
}
