import { FlashcardTrainer } from "@/features/words/components/flashcard-trainer";
import { WordsTrainEmptyState } from "@/features/words/components/words-train-empty-state";
import { buildWordSession } from "@/lib/words/queries";
import { wordSessionParamsSchema } from "@/lib/words/validation";

export async function renderWordsTrainRoute({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const parsed = wordSessionParamsSchema.safeParse({
    mode: firstParam(params.mode) ?? "default",
    topicSlug: firstParam(params.topicSlug) || undefined,
    setSlug: firstParam(params.setSlug) || undefined,
    limit: firstParam(params.limit) ?? "5"
  });

  const session = await buildWordSession(parsed.success ? parsed.data : { mode: "default", limit: 5 });

  if (session.words.length === 0) {
    return <WordsTrainEmptyState />;
  }

  return <FlashcardTrainer session={session} />;
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
