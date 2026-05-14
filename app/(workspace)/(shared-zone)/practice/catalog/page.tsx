import { renderPracticeCatalogRoute } from "@/features/practice/server/practice-library-routes";

export default async function PracticeCatalogPage({
  searchParams
}: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  return renderPracticeCatalogRoute({ searchParams });
}
