"use client";

import { usePathname } from "next/navigation";

import { MainFooter } from "@/features/marketing/components/main-footer";
import { MainHeader } from "@/features/marketing/components/main-header";
import { sitePrimaryNavItems } from "@/features/marketing/model/site-navigation";
import { cn } from "@/lib/utils";

const trialLessonPath = "/lp/trial-lesson";

export function PublicSiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isTrialLesson = pathname === trialLessonPath;

  return (
    <div
      className={cn(
        "min-h-screen text-[#322F55]",
        isTrialLesson
          ? "bg-[radial-gradient(circle_at_100%_100%,rgba(247,109,99,0.18)_0%,rgba(247,109,99,0.08)_18%,transparent_42%),linear-gradient(135deg,#2D284A_0%,#403965_50%,#554D82_100%)]"
          : "bg-[linear-gradient(180deg,#F8F7FC_0%,#F5F4FA_48%,#F3F1F8_100%)]"
      )}
    >
      <MainHeader navItems={sitePrimaryNavItems} />
      {children}
      <MainFooter leadHref="/#lead-form" variant={isTrialLesson ? "transparent" : "default"} />
    </div>
  );
}
