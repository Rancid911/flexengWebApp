import Link from "next/link";
import { ArrowRight, BookOpen, Brain, Layers, RotateCcw, Sparkles } from "lucide-react";

import { StudentPageHeader } from "@/app/(workspace)/_components/student-page-primitives";
import { Card, CardContent } from "@/components/ui/card";
import { getWordTopicSummaries, getWordsOverviewSummary } from "@/lib/words/queries";

import { WordsSubnav } from "../words-subnav";

export default async function WordsMyPage() {
  const [summary, topics] = await Promise.all([getWordsOverviewSummary(), getWordTopicSummaries()]);

  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader
        title="Карточки"
        description="Запоминайте английские слова через знакомство, активное вспоминание и повторение в нужный момент."
        actions={
          <Link href="/words/train" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#1f7aff] px-4 py-2 text-sm font-black text-white transition hover:bg-[#1669db]">
            Начать тренировку
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
      <WordsSubnav active="my" />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardBlock
          icon={<RotateCcw className="h-5 w-5" />}
          title="Повторить сегодня"
          value={String(summary.reviewCount)}
          description={summary.reviewCount > 0 ? "Слова, которые пора вспомнить сейчас." : "Сегодня нет слов для повторения."}
          href="/words/train?mode=review&limit=5"
          action="Повторить"
        />
        <DashboardBlock
          icon={<BookOpen className="h-5 w-5" />}
          title="Новые слова"
          value={String(summary.newCount)}
          description="Выберите тему и познакомьтесь с новой лексикой."
          href="/words/train?mode=new&limit=5"
          action="Изучить"
        />
        <DashboardBlock
          icon={<Brain className="h-5 w-5" />}
          title="Сложные слова"
          value={String(summary.difficultCount)}
          description="Слова, которые требуют более частого повторения."
          href="/words/difficult"
          action="Открыть"
        />
        <DashboardBlock
          icon={<Sparkles className="h-5 w-5" />}
          title="Прогресс"
          value={String(summary.masteredCount)}
          description={`Выучено из ${summary.totalWords} доступных слов.`}
          href="/words/train?mode=default&limit=5"
          action="Продолжить"
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-[#1f7aff]" />
          <h2 className="text-xl font-black tracking-tight text-slate-900">Темы</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {topics.map((topic) => (
            <Link key={topic.slug} href={`/words/topics/${topic.slug}`} className="group">
              <Card className="h-full rounded-[1.4rem] border-[#dde2e9] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)] transition group-hover:border-[#1f7aff]">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-lg font-black text-slate-900">{topic.title}</p>
                    <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-bold text-[#1f7aff]">{topic.availableCount}</span>
                  </div>
                  <p className="text-sm text-slate-500">{topic.description}</p>
                  {topic.difficultCount > 0 ? <p className="text-sm font-semibold text-amber-700">Сложных слов: {topic.difficultCount}</p> : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function DashboardBlock({
  icon,
  title,
  value,
  description,
  href,
  action
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <Card className="rounded-[1.8rem] border-[#dde2e9] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#1f7aff]">{icon}</span>
        <div className="space-y-1">
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-3xl font-black tracking-tight text-slate-900">{value}</p>
        </div>
        <p className="min-h-10 text-sm text-slate-500">{description}</p>
        <Link href={href} className="mt-auto inline-flex items-center gap-2 text-sm font-black text-[#1f7aff]">
          {action}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
