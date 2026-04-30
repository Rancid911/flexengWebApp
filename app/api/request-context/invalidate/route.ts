import { NextResponse } from "next/server";

import { getMinimalRequestContext, invalidateFullAppActorCache } from "@/lib/auth/request-context";

export async function POST() {
  const actor = await getMinimalRequestContext();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await invalidateFullAppActorCache(actor.userId);

  return NextResponse.json({ ok: true });
}
