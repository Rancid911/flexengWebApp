import { NextRequest, NextResponse } from "next/server";

import { getAppActor } from "@/lib/auth/request-context";
import { syncCurrentStudentTransaction } from "@/lib/payments/server";
import { requirePermission } from "@/lib/permissions";
import { HttpError, withApiErrorHandling } from "@/lib/server/http";

export const GET = withApiErrorHandling(async (request: NextRequest) => {
  const actor = await getAppActor();
  if (!actor) {
    throw new HttpError(401, "UNAUTHORIZED", "Authentication required");
  }
  requirePermission(actor, "payments.status.read");

  const transactionId = request.nextUrl.searchParams.get("transactionId")?.trim() ?? "";
  if (!transactionId) {
    throw new HttpError(400, "TRANSACTION_ID_REQUIRED", "transactionId is required");
  }

  const payload = await syncCurrentStudentTransaction(transactionId);
  return NextResponse.json(payload);
});
