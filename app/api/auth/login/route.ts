import { NextResponse } from "next/server";

import { signInWithPasswordFromRequest } from "@/lib/auth/auth-api.service";
import { withApiErrorHandling } from "@/lib/server/http";

export const POST = withApiErrorHandling(async (request: Request) => {
  await signInWithPasswordFromRequest(request);
  return NextResponse.json({ ok: true });
});
