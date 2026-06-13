import type { CrmRepositoryClient } from "@/lib/crm/leads.repository";

export async function loadCrmSettingsRow(supabase: CrmRepositoryClient) {
  return await supabase.from("crm_settings").select("background_image_url, updated_at").eq("id", true).maybeSingle();
}

export async function upsertCrmSettingsRow(
  supabase: CrmRepositoryClient,
  input: { backgroundImageUrl: string | null; updatedByProfileId: string }
) {
  return await supabase
    .from("crm_settings")
    .upsert(
      {
        id: true,
        background_image_url: input.backgroundImageUrl,
        updated_by_profile_id: input.updatedByProfileId
      },
      { onConflict: "id" }
    )
    .select("background_image_url, updated_at")
    .single();
}
