import { NextResponse } from "next/server";

import { signUpWithPasswordFromRequest } from "@/lib/auth/auth-api.service";
import { withApiErrorHandling } from "@/lib/server/http";

export const POST = withApiErrorHandling(async (request: Request) => {
  const result = await signUpWithPasswordFromRequest(request);
  return NextResponse.json({ ok: true, hasSession: result.hasSession });
});
