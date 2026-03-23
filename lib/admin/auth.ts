import { redirect } from "next/navigation";

import { getUserRoleById } from "@/lib/auth/get-user-role";
import { createClient } from "@/lib/supabase/server";
import { AdminHttpError } from "@/lib/admin/http";
import type { AdminActor } from "@/lib/admin/types";

async function getRoleOrThrow(userId: string) {
  const supabase = await createClient();
  try {
    return await getUserRoleById(supabase, userId);
  } catch {
    throw new AdminHttpError(500, "PROFILE_FETCH_FAILED", "Failed to fetch user role");
  }
}

export async function requireAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/");
  const role = await getRoleOrThrow(user.id);
  if (role !== "admin") redirect("/");
  return { userId: user.id };
}

export async function requireAdminApi(): Promise<AdminActor> {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();
  if (error || !user) throw new AdminHttpError(403, "FORBIDDEN", "Admin access required");

  const role = await getRoleOrThrow(user.id);
  if (role !== "admin") throw new AdminHttpError(403, "FORBIDDEN", "Admin access required");
  return { userId: user.id };
}
