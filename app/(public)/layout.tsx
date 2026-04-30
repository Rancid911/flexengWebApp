import { MainFooter } from "@/app/main/main-footer";
import { MainHeader } from "@/app/main/main-header";
import { sitePrimaryNavItems } from "@/app/main/site-navigation";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F8F7FC_0%,#F5F4FA_48%,#F3F1F8_100%)] text-[#322F55]">
      <MainHeader navItems={sitePrimaryNavItems} />
      {children}
      <MainFooter leadHref="/#lead-form" />
    </div>
  );
}
