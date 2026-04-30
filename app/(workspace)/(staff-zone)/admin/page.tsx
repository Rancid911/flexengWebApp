import { requireStaffAdminPage } from "@/lib/admin/auth";

import { AdminConsole } from "./ui/admin-console";

export default async function AdminPage() {
  await requireStaffAdminPage();
  return <AdminConsole />;
}
