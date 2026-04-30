import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/config";
import { measureServerTiming } from "@/lib/server/timing";

const AUTH_PAGE_PATHS = new Set(["/login", "/register", "/forgot-password", "/reset-password"]);
const PROTECTED_APP_PREFIXES = [
  "/dashboard",
  "/schedule",
  "/students",
  "/settings",
  "/admin",
  "/practice",
  "/progress",
  "/homework",
  "/learning",
  "/student-dashboard",
  "/words",
  "/flashcards",
  "/assignments",
  "/tests"
];
const PROTECTED_API_PREFIXES = [
  "/api/admin/",
  "/api/notifications",
  "/api/schedule",
  "/api/search",
  "/api/students/",
  "/api/teacher-notes/",
  "/api/payments"
];
const PUBLIC_API_EXACT_PATHS = new Set([
  "/api/payments/yookassa/webhook"
]);

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies.getAll().some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"));
}

export function isProtectedAppPath(pathname: string) {
  return PROTECTED_APP_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

export function isProtectedApiPath(pathname: string) {
  if (PUBLIC_API_EXACT_PATHS.has(pathname)) return false;
  return PROTECTED_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAuthPage = AUTH_PAGE_PATHS.has(pathname);
  const isProtectedAppPage = isProtectedAppPath(pathname);
  const isProtectedApi = isProtectedApiPath(pathname);
  const hasAuthCookie = hasSupabaseAuthCookie(request);

  // App pages use the server request-context as the source of truth.
  // Middleware only performs a cheap cookie gate to avoid a duplicate auth roundtrip.
  if (isProtectedAppPage && !hasAuthCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirectResponse = NextResponse.redirect(url);
    redirectResponse.headers.set("Cache-Control", "private, no-store");
    return redirectResponse;
  }

  if (!isProtectedApi && !isAuthPage) {
    const response = NextResponse.next({ request });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        }
      }
    }
  );

  const {
    data: { user }
  } = await measureServerTiming("request-context-auth-middleware", async () => await supabase.auth.getUser());

  if (!user && isProtectedApi) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirectResponse = NextResponse.redirect(url);
    redirectResponse.headers.set("Cache-Control", "private, no-store");
    return redirectResponse;
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    const redirectResponse = NextResponse.redirect(url);
    redirectResponse.headers.set("Cache-Control", "private, no-store");
    return redirectResponse;
  }

  supabaseResponse.headers.set("Cache-Control", "private, no-store");
  return supabaseResponse;
}
