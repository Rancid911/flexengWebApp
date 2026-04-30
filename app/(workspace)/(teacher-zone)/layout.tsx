import { WorkspaceShell } from "../workspace-shell.server";
import { resolveWorkspaceShellOptions } from "../workspace-shell-options";

export default async function TeacherZoneLayout({ children }: { children: React.ReactNode }) {
  const shellOptions = resolveWorkspaceShellOptions({ shellVariant: "teacher" });

  return <WorkspaceShell {...shellOptions}>{children}</WorkspaceShell>;
}
