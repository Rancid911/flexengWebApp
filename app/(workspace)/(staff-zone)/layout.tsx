import { WorkspaceShell } from "../workspace-shell.server";
import { resolveWorkspaceShellOptions } from "../workspace-shell-options";
import { loadCrmSettings } from "@/lib/crm/queries";

export default async function StaffZoneLayout({ children }: { children: React.ReactNode }) {
  const shellOptions = resolveWorkspaceShellOptions({ shellVariant: "staff" });
  const crmSettings = await loadCrmSettings();

  return <WorkspaceShell {...shellOptions} crmBackgroundImageUrl={crmSettings.background_image_url}>{children}</WorkspaceShell>;
}
