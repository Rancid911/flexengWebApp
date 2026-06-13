import { CRM_DEFAULT_STATUS } from "@/lib/crm/stages";
import type { publicLeadCreateSchema } from "@/lib/crm/validation";
import { HttpError } from "@/lib/server/http";
import { createClient } from "@/lib/supabase/server";
import type { z } from "zod";

export type PublicCrmLeadCreateInput = z.infer<typeof publicLeadCreateSchema>;

type PublicCrmLeadRpcRow = {
  id: string;
  status: string;
};

export async function createPublicCrmLead(input: PublicCrmLeadCreateInput) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_public_crm_lead", {
    p_name: input.name,
    p_phone: input.phone,
    p_email: input.email,
    p_form_type: input.form_type,
    p_comment: input.comment ?? null,
    p_source: input.source ?? null,
    p_page_url: input.page_url ?? null,
    p_metadata: input.metadata ?? {}
  });

  const lead = ((data ?? []) as PublicCrmLeadRpcRow[])[0] ?? null;
  if (error || !lead) {
    throw new HttpError(500, "LEAD_CREATE_FAILED", "Failed to create lead", error?.message);
  }

  return { id: String(lead.id), status: lead.status || CRM_DEFAULT_STATUS };
}
