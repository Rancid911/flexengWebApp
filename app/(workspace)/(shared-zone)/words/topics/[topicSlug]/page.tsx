import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Layers } from "lucide-react";

import { StudentPageHeader } from "@/app/(workspace)/_components/student-page-primitives";
import { Card, CardContent } from "@/components/ui/card";
import { getWordTopicDetail } from "@/lib/words/queries";

import { WordsSubnav } from "../../words-subnav";

export default async function WordTopicPage({ params }: { params: Promise<{ topicSlug: string }> }) {
  const { topicSlug } = await params;
  const detail = await getWordTopicDetail(topicSlug);
  if (!detail) notFound();

  return (
    <div className="space-y-6 pb-8">
      <Link href="/words/my" className="inline-flex items-center gap-2 text-sm font-black text-[#1f7aff]">
        <ArrowLeft className="h-4 w-4" />
        Назад к темам
      </Link>
      <StudentPageHeader title={detail.topic.title} description={detail.topic.description} />
      <WordsSubnav active="my" />

      <section className="grid gap-4 md:grid-cols-3">
        <TopicStat label="Доступно" value={detail.availableCount} hint="слов в наборах темы" />
        <TopicStat label="Сложные" value={detail.difficultCount} hint="нужны частые повторения" />
        <TopicStat label="Выучено" value={detail.masteredCount} hint="уже закреплены" />
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-[#1f7aff]" />
          <h2 className="text-xl font-black tracking-tight text-slate-900">Наборы карточек</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {detail.sets.map((set) => {
            const actualCount = Math.min(15, set.availableCount);
            return (
              <Card key={set.slug} className="rounded-[1.4rem] border-[#dde2e9] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
                <CardContent className="space-y-5 p-5">
                  <div className="space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <h3 className="text-xl font-black tracking-tight text-slate-900">{set.title}</h3>
                      <div className="flex flex-wrap gap-2">
                        {set.cefrLevel ? <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{set.cefrLevel}</span> : null}
                        <span className="w-fit rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-bold text-[#1f7aff]">{set.availableCount} слов</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500">{set.description}</p>
                    {set.availableCount < 15 ? <p className="text-xs font-semibold text-slate-500">Если выбрать больше, стартует {actualCount} доступных слов.</p> : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {set.previewWords.map((word) => (
                      <span key={word.term} className="rounded-full border border-[#dde2e9] px-3 py-1 text-xs font-semibold text-slate-600">
                        {word.term} - {word.translation}
                      </span>
                    ))}
                  </div>

                  <form action="/words/train" className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                    <input type="hidden" name="mode" value="new" />
                    <input type="hidden" name="topicSlug" value={detail.topic.slug} />
                    <input type="hidden" name="setSlug" value={set.slug} />
                    <label className="space-y-1">
                      <span className="text-xs font-bold uppercase text-slate-500">Слов запоминать</span>
                      <select name="limit" defaultValue="5" className="h-11 w-full rounded-xl border border-[#d9e1ec] bg-white px-3 text-sm font-semibold text-slate-700">
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                      </select>
                    </label>
                    <button
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-black text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={set.availableCount === 0}
                    >
                      Начать набор
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function TopicStat({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <Card className="rounded-[1.4rem] border-[#dde2e9] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
      <CardContent className="space-y-2 p-5">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-3xl font-black tracking-tight text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{hint}</p>
      </CardContent>
    </Card>
  );
}
