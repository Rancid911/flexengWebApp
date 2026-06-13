import { WorkspaceShell } from "@/features/workspace-shell/server/workspace-shell.server";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
