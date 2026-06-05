import { NextResponse } from "next/server";

import { changePasswordFromRequest } from "@/lib/auth/auth-api.service";
import { withApiErrorHandling } from "@/lib/server/http";

export const POST = withApiErrorHandling(async (request: Request) => {
  await changePasswordFromRequest(request);
  return NextResponse.json({ ok: true });
});
