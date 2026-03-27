import { NextRequest, NextResponse } from "next/server";

import { toErrorResponse } from "@/lib/admin/http";
import { processYooKassaWebhook } from "@/lib/payments/server";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => ({}));
    const token = request.nextUrl.searchParams.get("token");
    await processYooKassaWebhook(payload, token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
