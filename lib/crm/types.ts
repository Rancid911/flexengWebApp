import type { CrmLeadStatus } from "@/lib/crm/stages";

export type CrmLeadCardDto = {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: string | null;
  form_type: string;
  page_url: string | null;
  comment: string | null;
  status: CrmLeadStatus;
  viewed_at: string | null;
  viewed_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CrmLeadHistoryDto = {
  id: string;
  from_status: CrmLeadStatus | null;
  to_status: CrmLeadStatus;
  changed_by: string | null;
  changed_by_name: string | null;
  created_at: string;
};

export type CrmLeadCommentDto = {
  id: string;
  body: string;
  author_id: string | null;
  author_name: string | null;
  created_at: string;
};

export type CrmLeadDetailDto = CrmLeadCardDto & {
  history: CrmLeadHistoryDto[];
  comments: CrmLeadCommentDto[];
};

export type CrmBoardDto = {
  stages: Array<{
    slug: CrmLeadStatus;
    title: string;
    leads: CrmLeadCardDto[];
  }>;
};

export type CrmSettingsDto = {
  background_image_url: string | null;
  updated_at: string | null;
};
