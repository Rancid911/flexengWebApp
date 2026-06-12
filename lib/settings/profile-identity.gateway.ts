import { runAuthRequestWithLockRetry } from "@/lib/supabase/auth-request";
import type { createClient } from "@/lib/supabase/server";

export type SettingsProfileIdentityClient = Awaited<ReturnType<typeof createClient>>;

export function createSettingsProfileIdentityGateway(client: SettingsProfileIdentityClient) {
  return {
    getCurrentUser() {
      return runAuthRequestWithLockRetry(() => client.auth.getUser());
    },

    updateEmail(email: string, emailRedirectTo: string) {
      return runAuthRequestWithLockRetry(() =>
        client.auth.updateUser({ email }, { emailRedirectTo })
      );
    }
  };
}
