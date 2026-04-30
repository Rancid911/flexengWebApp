import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { StudentEmptyState, StudentPageHeader } from "@/app/(workspace)/_components/student-page-primitives";
import { Card, CardContent } from "@/components/ui/card";
import { getWordsForReview } from "@/lib/words/queries";

import { WordsSubnav } from "../words-subnav";

export default async function WordsReviewPage() {
  const words = await getWordsForReview();

  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader
        title="Повторить сегодня"
        description="Слова, которые система считает нужным повторить сейчас."
        actions={
          words.length > 0 ? (
            <Link href="/words/train?mode=review&limit=10" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#1f7aff] px-4 py-2 text-sm font-black text-white transition hover:bg-[#1669db]">
              Начать повторение
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null
        }
      />
      <WordsSubnav active="review" />
      {words.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {words.map((item) => (
            <WordPreviewCard key={item.id} term={item.term} translation={item.translation} example={item.example} status={item.status} />
          ))}
        </div>
      ) : (
        <StudentEmptyState title="Сегодня нет слов для повторения" description="Можно изучить новые слова." />
      )}
    </div>
  );
}

function WordPreviewCard({ term, translation, example, status }: { term: string; translation: string; example: string; status: string }) {
  return (
    <Card className="rounded-[1.4rem] border-[#dde2e9] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
      <CardContent className="space-y-2 p-5">
        <p className="text-2xl font-black tracking-tight text-slate-900">{term}</p>
        <p className="text-base text-slate-600">{translation}</p>
        <p className="text-sm text-slate-500">{example}</p>
        <p className="text-xs font-bold uppercase text-indigo-700">{status}</p>
      </CardContent>
    </Card>
  );
}
