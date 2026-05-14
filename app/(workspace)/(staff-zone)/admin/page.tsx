import { requireStaffAdminPage } from "@/lib/admin/auth";

import { AdminConsole } from "@/features/admin/components/admin-console/admin-console";

export default async function AdminPage() {
  await requireStaffAdminPage();
  return <AdminConsole />;
}
