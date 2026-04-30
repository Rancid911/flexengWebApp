"use client";

import dynamic from "next/dynamic";
import { Search } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

const SearchIsland = dynamic(
  () => import("@/components/search/dashboard-global-search").then((module) => module.DashboardGlobalSearch),
  { ssr: false }
);

export function LazyWorkspaceSearchTrigger({ crmGlassMode = false }: { crmGlassMode?: boolean }) {
  const [activated, setActivated] = useState(false);

  if (activated) {
    return <SearchIsland autoFocusOnMount />;
  }

  return (
    <button
      type="button"
      data-testid="dashboard-search-trigger"
      onClick={() => setActivated(true)}
      onFocus={() => setActivated(true)}
      className={cn(
        "flex h-10 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300",
        crmGlassMode
          ? "border border-white/20 bg-white/14 text-white/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-white/20 hover:text-white"
          : "bg-[#eef1f3] text-slate-500 hover:bg-[#e7ebef]"
      )}
      aria-label="Открыть глобальный поиск"
    >
      <Search className={cn("h-4 w-4 shrink-0", crmGlassMode ? "text-white" : "text-slate-400")} />
      <span className="truncate">Поиск по сайту</span>
    </button>
  );
}
