import { NextResponse } from "next/server";

import { getCurrentAuthUser } from "@/lib/auth/auth-api.service";
import { HttpError, withApiErrorHandling } from "@/lib/server/http";

export const GET = withApiErrorHandling(async () => {
  const user = await getCurrentAuthUser();
  if (!user) {
    throw new HttpError(401, "UNAUTHORIZED", "Authentication required");
  }
  return NextResponse.json({ user });
});
