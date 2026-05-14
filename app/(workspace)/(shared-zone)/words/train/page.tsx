import { renderWordsTrainRoute } from "@/features/words/server/words-train-route";

export default async function WordsTrainPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return renderWordsTrainRoute({ searchParams });
}
