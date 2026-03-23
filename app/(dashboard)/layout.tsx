import { redirect } from "next/navigation";

import type { UserRole } from "@/lib/auth/get-user-role";
import { getUserRoleById } from "@/lib/auth/get-user-role";
import { createClient } from "@/lib/supabase/server";

import DashboardShellClient from "./dashboard-shell-client";

type DashboardInitialProfile = {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole | null;
};

function buildDisplayName(
  profile: { display_name: string | null; first_name: string | null; last_name: string | null } | null,
  email: string
) {
  return profile?.display_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || email.split("@")[0] || "";
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const role = await getUserRoleById(supabase, user.id);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name, first_name, last_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to load dashboard profile data:", profileError);
  }

  const initialProfile: DashboardInitialProfile = {
    userId: user.id,
    displayName: buildDisplayName(profile, user.email ?? ""),
    email: user.email ?? "",
    avatarUrl: profile?.avatar_url ?? null,
    role
  };

  return <DashboardShellClient initialProfile={initialProfile}>{children}</DashboardShellClient>;
}
