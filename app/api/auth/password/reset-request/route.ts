import { NextResponse } from "next/server";

import { requestPasswordResetFromRequest } from "@/lib/auth/auth-api.service";
import { withApiErrorHandling } from "@/lib/server/http";

export const POST = withApiErrorHandling(async (request: Request) => {
  await requestPasswordResetFromRequest(request);
  return NextResponse.json({ ok: true });
});
