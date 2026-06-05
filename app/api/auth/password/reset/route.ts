import { NextResponse } from "next/server";

import { resetPasswordFromRequest } from "@/lib/auth/auth-api.service";
import { withApiErrorHandling } from "@/lib/server/http";

export const POST = withApiErrorHandling(async (request: Request) => {
  await resetPasswordFromRequest(request);
  return NextResponse.json({ ok: true });
});
