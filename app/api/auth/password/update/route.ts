import { NextResponse } from "next/server";

import { withApiErrorHandling } from "@/lib/server/http";

export const POST = withApiErrorHandling(async () => {
  return NextResponse.json(
    {
      code: "PASSWORD_UPDATE_ENDPOINT_RETIRED",
      message: "This password update endpoint has been retired. Use the explicit password change or recovery reset flow."
    },
    { status: 410 }
  );
});
