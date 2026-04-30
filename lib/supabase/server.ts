import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/config";

/**
 * SSR user-scoped Supabase client.
 * Use this for authenticated server reads/writes that should honor auth cookies and RLS.
 * Do not use this factory for browser code or service-role/server-wide workflows.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Can be called from a Server Component where cookie writes are restricted.
          }
        }
      }
    }
  );
}
