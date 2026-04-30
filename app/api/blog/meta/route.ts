import { NextResponse } from "next/server";

import { getBlogMeta } from "@/lib/blog/public";
import { withApiErrorHandling } from "@/lib/server/http";

export const GET = withApiErrorHandling(async () => {
    return NextResponse.json(await getBlogMeta());
});
