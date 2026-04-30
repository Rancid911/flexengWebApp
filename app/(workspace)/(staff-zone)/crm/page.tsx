import { requireStaffAdminPage } from "@/lib/admin/auth";
import { loadCrmBoard, loadCrmSettings } from "@/lib/crm/queries";

import { CrmBoardClient } from "./crm-board-client";

export default async function CrmPage() {
  await requireStaffAdminPage();
  const [board, settings] = await Promise.all([loadCrmBoard(), loadCrmSettings()]);

  return <CrmBoardClient initialBoard={board} initialSettings={settings} />;
}
