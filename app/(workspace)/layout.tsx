import { ensureWorkspaceActor } from "./workspace-shell.server";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  await ensureWorkspaceActor();
  return children;
}
