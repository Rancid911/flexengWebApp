import { NextResponse } from "next/server";

import { updatePasswordFromRequest } from "@/lib/auth/auth-api.service";
import { withApiErrorHandling } from "@/lib/server/http";

export const POST = withApiErrorHandling(async (request: Request) => {
  await updatePasswordFromRequest(request);
  return NextResponse.json({ ok: true });
});
