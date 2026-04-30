import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { StudentEmptyState, StudentPageHeader } from "@/app/(workspace)/_components/student-page-primitives";
import { Card, CardContent } from "@/components/ui/card";
import { getNewWords } from "@/lib/words/queries";

import { WordsSubnav } from "../words-subnav";

export default async function WordsNewPage() {
  const words = await getNewWords();

  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader
        title="Новые слова"
        description="Слова из встроенных тем, которые вы ещё не закрепляли."
        actions={
          <Link href="/words/train?mode=new&limit=5" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#1f7aff] px-4 py-2 text-sm font-black text-white transition hover:bg-[#1669db]">
            Изучить новые
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
      <WordsSubnav active="new" />
      {words.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {words.map((item) => (
            <Card key={item.id} className="rounded-[1.4rem] border-[#dde2e9] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
              <CardContent className="space-y-2 p-5">
                <p className="text-sm font-bold text-[#1f7aff]">{item.topicTitle}</p>
                <p className="text-2xl font-black tracking-tight text-slate-900">{item.term}</p>
                <p className="text-base text-slate-600">{item.translation}</p>
                <p className="text-sm text-slate-500">{item.example}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <StudentEmptyState title="Новых слов пока нет" description="Выберите тему на экране карточек или повторите уже добавленные слова." />
      )}
    </div>
  );
}
