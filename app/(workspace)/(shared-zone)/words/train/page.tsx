import { renderWordsTrainRoute } from "@/features/words/server/words-train-route";
import { requireWorkspaceRouteAccess } from "@/lib/auth/rbac-route-guard";

export default async function WordsTrainPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireWorkspaceRouteAccess("words");
  return renderWordsTrainRoute({ searchParams });
}
