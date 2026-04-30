export const CRM_STAGES = [
  { slug: "new_request", title: "Новый запрос" },
  { slug: "not_reached", title: "Не дозвонились" },
  { slug: "contact_established", title: "Контакт установлен" },
  { slug: "not_fit", title: "Не подходит" },
  { slug: "consultation_scheduled", title: "Назначена консультация" },
  { slug: "consultation_no_show", title: "Не посетил консультацию" },
  { slug: "consultation_done", title: "Консультация проведена" },
  { slug: "thinking", title: "Думает" },
  { slug: "contract_sent", title: "Договор отправлен" },
  { slug: "contract_signed", title: "Договор подписан" },
  { slug: "awaiting_payment", title: "Ожидается оплата" }
] as const;

export type CrmLeadStatus = (typeof CRM_STAGES)[number]["slug"];

export const CRM_DEFAULT_STATUS: CrmLeadStatus = "new_request";

export const CRM_STAGE_TITLES = CRM_STAGES.reduce(
  (acc, stage) => {
    acc[stage.slug] = stage.title;
    return acc;
  },
  {} as Record<CrmLeadStatus, string>
);

export function isCrmLeadStatus(value: unknown): value is CrmLeadStatus {
  return typeof value === "string" && value in CRM_STAGE_TITLES;
}

export function getCrmStageTitle(status: CrmLeadStatus) {
  return CRM_STAGE_TITLES[status];
}
