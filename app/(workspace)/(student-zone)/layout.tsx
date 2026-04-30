import { WorkspaceShell } from "../workspace-shell.server";
import { resolveWorkspaceShellOptions } from "../workspace-shell-options";

export default async function StudentZoneLayout({ children }: { children: React.ReactNode }) {
  const shellOptions = resolveWorkspaceShellOptions({ shellVariant: "student" });

  return <WorkspaceShell {...shellOptions}>{children}</WorkspaceShell>;
}
