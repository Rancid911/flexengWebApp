import { renderSearchRoute } from "@/features/search/server/search-route";

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; section?: string }>;
}) {
  return renderSearchRoute({ searchParams });
}
