import { createSettingsProfileAvatarGateway } from "@/lib/settings/profile-avatar.gateway";
import { createSettingsProfileIdentityGateway } from "@/lib/settings/profile-identity.gateway";
import { createSettingsProfileRepository } from "@/lib/settings/profile.repository";
import { createClient } from "@/lib/supabase/server";

export async function createSettingsProfileInfrastructure() {
  const client = await createClient();

  return {
    avatarGateway: createSettingsProfileAvatarGateway(client),
    identityGateway: createSettingsProfileIdentityGateway(client),
    repository: createSettingsProfileRepository(client)
  };
}

export type SettingsProfileInfrastructure = Awaited<
  ReturnType<typeof createSettingsProfileInfrastructure>
>;
