import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const rawNext = searchParams.get("next") ?? "/";
  const allowedNext = new Set(["/", "/reset-password", "/reset-password?flow=recovery"]);
  const next = allowedNext.has(rawNext) ? rawNext : "/";
  const redirectTarget = `${origin}${next}`;

  const supabase = await createClient();

  // PKCE flow (common in SSR): exchange authorization code for session.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(redirectTarget);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type: type as EmailOtpType, token_hash: tokenHash });

    if (!error) {
      return NextResponse.redirect(redirectTarget);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_confirm_failed`);
}
