import Link from "next/link";

import { StudentEmptyState } from "@/app/(workspace)/_components/student-page-primitives";
import { buildWordSession } from "@/lib/words/queries";
import { wordSessionParamsSchema } from "@/lib/words/validation";

import { FlashcardTrainer } from "./flashcard-trainer";

export default async function WordsTrainPage({
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
    return (
      <div className="space-y-6 pb-8">
        <Link href="/words/my" className="text-sm font-black text-[#1f7aff]">
          Вернуться в карточки
        </Link>
        <StudentEmptyState title="Для этой тренировки нет слов" description="Выберите другую тему или режим на экране карточек." />
      </div>
    );
  }

  return <FlashcardTrainer session={session} />;
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
