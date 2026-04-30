import { createClient } from "@supabase/supabase-js";

import { AdminHttpError } from "@/lib/admin/http";
import { getSupabaseUrl } from "@/lib/supabase/config";

/**
 * Privileged / aggregate Supabase client backed by the service-role key.
 * Allowed only for staff/server workflows, cross-user writes, batch aggregation,
 * and explicitly documented infrastructure exceptions.
 */
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
