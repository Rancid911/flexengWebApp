import { requireAdminPageAnyPermission } from "@/lib/admin/auth";

import { AdminConsole } from "@/features/admin/components/admin-console/admin-console";

export default async function AdminPage() {
  await requireAdminPageAnyPermission(["users.view", "content.manage", "notifications.manage", "word_cards.manage"]);
  return <AdminConsole />;
}
