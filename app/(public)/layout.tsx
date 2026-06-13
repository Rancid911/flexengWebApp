import { PublicSiteShell } from "@/features/marketing/components/public-site-shell";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <PublicSiteShell>{children}</PublicSiteShell>;
}
