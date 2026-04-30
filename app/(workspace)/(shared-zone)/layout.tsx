import { WorkspaceShell } from "../workspace-shell.server";
import { resolveWorkspaceShellOptions } from "../workspace-shell-options";

export default async function SharedZoneLayout({ children }: { children: React.ReactNode }) {
  const shellOptions = resolveWorkspaceShellOptions({ shellVariant: "shared" });

  return <WorkspaceShell {...shellOptions}>{children}</WorkspaceShell>;
}
