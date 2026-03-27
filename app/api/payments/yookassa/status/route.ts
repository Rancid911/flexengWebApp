import { NextRequest, NextResponse } from "next/server";

import { AdminHttpError, toErrorResponse } from "@/lib/admin/http";
import { syncCurrentStudentTransaction } from "@/lib/payments/server";

export async function GET(request: NextRequest) {
  try {
    const transactionId = request.nextUrl.searchParams.get("transactionId")?.trim() ?? "";
    if (!transactionId) {
      throw new AdminHttpError(400, "TRANSACTION_ID_REQUIRED", "transactionId is required");
    }

    const payload = await syncCurrentStudentTransaction(transactionId);
    return NextResponse.json(payload);
  } catch (error) {
    return toErrorResponse(error);
  }
}
