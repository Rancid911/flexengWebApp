import { WorkspaceShell } from "../workspace-shell.server";
import { resolveWorkspaceShellOptions } from "../workspace-shell-options";

export default async function SearchZoneLayout({ children }: { children: React.ReactNode }) {
  const shellOptions = resolveWorkspaceShellOptions({
    shellVariant: "shared",
    pathname: "/search"
  });

  return <WorkspaceShell {...shellOptions}>{children}</WorkspaceShell>;
}
