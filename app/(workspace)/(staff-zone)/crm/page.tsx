import { requireAdminPagePermission } from "@/lib/admin/auth";
import { loadCrmBoard, loadCrmSettings } from "@/lib/crm/queries";
import { CrmBoardClient } from "@/features/crm/components/crm-board-client";

export default async function CrmPage() {
  await requireAdminPagePermission("crm.leads.view");
  const [board, settings] = await Promise.all([loadCrmBoard(), loadCrmSettings()]);

  return <CrmBoardClient initialBoard={board} initialSettings={settings} />;
}
