import { NextRequest, NextResponse } from "next/server";

import { syncCurrentStudentTransaction } from "@/lib/payments/server";
import { HttpError, withApiErrorHandling } from "@/lib/server/http";

export const GET = withApiErrorHandling(async (request: NextRequest) => {
    const transactionId = request.nextUrl.searchParams.get("transactionId")?.trim() ?? "";
    if (!transactionId) {
      throw new HttpError(400, "TRANSACTION_ID_REQUIRED", "transactionId is required");
    }

    const payload = await syncCurrentStudentTransaction(transactionId);
    return NextResponse.json(payload);
});
