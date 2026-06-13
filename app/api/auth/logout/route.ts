import { NextResponse } from "next/server";

import { signOutCurrentSession } from "@/lib/auth/auth-api.service";
import { withApiErrorHandling } from "@/lib/server/http";

export const POST = withApiErrorHandling(async () => {
  await signOutCurrentSession();
  return NextResponse.json({ ok: true });
});
