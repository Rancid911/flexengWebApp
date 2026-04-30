import { NextRequest, NextResponse } from "next/server";

import { processYooKassaWebhook } from "@/lib/payments/server";
import { withApiErrorHandling } from "@/lib/server/http";

export const POST = withApiErrorHandling(async (request: NextRequest) => {
    const payload = await request.json().catch(() => ({}));
    const token = request.nextUrl.searchParams.get("token");
    await processYooKassaWebhook(payload, token);
    return NextResponse.json({ ok: true });
});
