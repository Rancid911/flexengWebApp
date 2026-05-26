import { Suspense } from "react";
import { notFound } from "next/navigation";

import { MainFooter } from "@/features/marketing/components/main-footer";
import { MainHeader } from "@/features/marketing/components/main-header";
import { sitePrimaryNavItems } from "@/features/marketing/model/site-navigation";
import { SearchPageLoadingSkeleton } from "@/features/search/components/search-page-loading-skeleton";
import { SearchPageView } from "@/features/search/components/search-page-view";
import { resolveWorkspaceShellOptions } from "@/features/workspace-shell/server/workspace-shell-options";
import { WorkspaceShell } from "@/features/workspace-shell/server/workspace-shell.server";
import { getLayoutActor } from "@/lib/auth/request-context";
import { can } from "@/lib/permissions";

type SearchRouteProps = {
  searchParams: Promise<{ q?: string; section?: string }>;
};

export async function renderSearchRoute({ searchParams }: SearchRouteProps) {
  const resolvedSearchParams = await searchParams;
  const actor = await getLayoutActor();
  const content = (
    <Suspense fallback={<SearchPageLoadingSkeleton />}>
      <SearchPageView searchParams={resolvedSearchParams} />
    </Suspense>
  );

  if (actor) {
    if (!can(actor, "search.ui")) {
      notFound();
    }

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
