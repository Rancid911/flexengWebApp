import { CRM_DEFAULT_STATUS } from "@/lib/crm/stages";
import { createCrmLeadRow, createCrmLeadStatusHistoryRow } from "@/lib/crm/leads.repository";
import type { publicLeadCreateSchema } from "@/lib/crm/validation";
import { HttpError } from "@/lib/server/http";
import type { z } from "zod";

export type PublicCrmLeadCreateInput = z.infer<typeof publicLeadCreateSchema>;

export async function createPublicCrmLead(input: PublicCrmLeadCreateInput) {
  const { data: lead, error: leadError } = await createCrmLeadRow(input);

  if (leadError || !lead) {
    throw new HttpError(500, "LEAD_CREATE_FAILED", "Failed to create lead");
  }

  const { error: historyError } = await createCrmLeadStatusHistoryRow({
    leadId: String(lead.id),
    fromStatus: null,
    toStatus: CRM_DEFAULT_STATUS,
    changedBy: null
  });

  if (historyError) {
    throw new HttpError(500, "LEAD_HISTORY_CREATE_FAILED", "Failed to create lead history");
  }

  return { id: String(lead.id), status: CRM_DEFAULT_STATUS };
}
