import { createClient } from "@supabase/supabase-js";

import { AdminHttpError } from "@/lib/admin/http";
import { getSupabaseUrl } from "@/lib/supabase/config";

export function createAdminClient() {
  const url = getSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new AdminHttpError(500, "CONFIGURATION_ERROR", "SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
