import { createAdminClient } from "@/lib/supabase/admin";

export async function loadCrmSettingsRow() {
  const supabase = createAdminClient();
  return await supabase.from("crm_settings").select("background_image_url, updated_at").eq("id", true).maybeSingle();
}

export async function upsertCrmSettingsRow(input: { backgroundImageUrl: string | null; updatedByProfileId: string }) {
  const supabase = createAdminClient();
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
