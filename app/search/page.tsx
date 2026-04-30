import { MainFooter } from "@/app/main/main-footer";
import { MainHeader } from "@/app/main/main-header";
import { sitePrimaryNavItems } from "@/app/main/site-navigation";
import { WorkspaceShell } from "@/app/(workspace)/workspace-shell.server";
import { resolveWorkspaceShellOptions } from "@/app/(workspace)/workspace-shell-options";
import { getLayoutActor } from "@/lib/auth/request-context";

import { SearchPageView } from "./search-page-view";

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; section?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const actor = await getLayoutActor();
  const content = <SearchPageView searchParams={resolvedSearchParams} />;

  if (actor) {
    const shellOptions = resolveWorkspaceShellOptions({
      shellVariant: "shared",
      pathname: "/search"
    });

    return <WorkspaceShell {...shellOptions}>{content}</WorkspaceShell>;
  }

  return (
    <div
      data-testid="public-search-shell"
      className="bg-[linear-gradient(180deg,#F8F7FC_0%,#F5F4FA_48%,#F3F1F8_100%)] text-[#322F55] flex flex-col"
    >
      <div data-testid="public-search-viewport" className="flex min-h-[calc(100dvh-56px)] flex-col">
        <MainHeader navItems={sitePrimaryNavItems} />
        <div className="flex flex-1 flex-col">{content}</div>
      </div>
      <MainFooter leadHref="/#lead-form" />
    </div>
  );
}
