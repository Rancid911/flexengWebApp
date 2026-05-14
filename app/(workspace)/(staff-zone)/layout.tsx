import { WorkspaceShell } from "@/features/workspace-shell/server/workspace-shell.server";
import { resolveWorkspaceShellOptions } from "@/features/workspace-shell/server/workspace-shell-options";

export default async function StaffZoneLayout({ children }: { children: React.ReactNode }) {
  const shellOptions = resolveWorkspaceShellOptions({ shellVariant: "staff" });

  return <WorkspaceShell {...shellOptions}>{children}</WorkspaceShell>;
}
