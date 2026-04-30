import { z } from "zod";

import { CRM_STAGES } from "@/lib/crm/stages";

const crmStatusEnum = z.enum(CRM_STAGES.map((stage) => stage.slug) as [string, ...string[]]);

const nullableTrimmedString = (max: number) =>
  z.preprocess(
    (value) => {
      if (value == null) return null;
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    },
    z.string().max(max).nullable().optional()
  );

export const publicLeadCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    phone: z.string().trim().min(5).max(50),
    email: z.string().trim().toLowerCase().email().max(320),
    comment: nullableTrimmedString(5000),
    source: nullableTrimmedString(200),
    form_type: z.string().trim().min(1).max(150),
    page_url: nullableTrimmedString(1000),
    metadata: z.record(z.string(), z.unknown()).optional().default({})
  })
  .strict();

export const crmLeadStatusUpdateSchema = z
  .object({
    status: crmStatusEnum
  })
  .strict();

export const crmLeadCommentCreateSchema = z
  .object({
    body: z.string().trim().min(1).max(5000)
  })
  .strict();
