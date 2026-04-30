import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { StudentEmptyState, StudentPageHeader } from "@/app/(workspace)/_components/student-page-primitives";
import { Card, CardContent } from "@/components/ui/card";
import { getDifficultWords } from "@/lib/words/queries";

import { WordsSubnav } from "../words-subnav";

export default async function WordsDifficultPage() {
  const words = await getDifficultWords();

  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader
        title="Сложные слова"
        description="Слова, которые вы отметили сложными или не смогли вспомнить."
        actions={
          words.length > 0 ? (
            <Link href="/words/train?mode=difficult&limit=10" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#1f7aff] px-4 py-2 text-sm font-black text-white transition hover:bg-[#1669db]">
              Повторить сложные
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null
        }
      />
      <WordsSubnav active="difficult" />
      {words.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {words.map((item) => (
            <Card key={item.id} className="rounded-[1.4rem] border-[#dde2e9] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
              <CardContent className="space-y-2 p-5">
                <p className="text-sm font-bold text-amber-700">{item.topicTitle}</p>
                <p className="text-2xl font-black tracking-tight text-slate-900">{item.term}</p>
                <p className="text-base text-slate-600">{item.translation}</p>
                <p className="text-sm text-slate-500">{item.example}</p>
                <p className="text-xs font-bold uppercase text-indigo-700">{item.status}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <StudentEmptyState title="Сложных слов пока нет" description="Если слово не вспомнится на тренировке, оно появится здесь." />
      )}
    </div>
  );
}
