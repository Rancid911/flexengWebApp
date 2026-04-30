import Link from "next/link";
import { ArrowRight, Brain, Target } from "lucide-react";

import { StudentPageHeader, StudentStatCard, StudentSubnav } from "@/app/(workspace)/_components/student-page-primitives";
import { getProgressOverview } from "@/lib/progress/queries";
import { measureServerTiming } from "@/lib/server/timing";
import { Card, CardContent } from "@/components/ui/card";

export default async function ProgressOverviewPage() {
  const overview = await measureServerTiming("progress-overview-route-data", () => getProgressOverview());
  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader title="Прогресс" description="Понимайте, как идёт обучение, и сразу переходите к следующему полезному действию." />
      <StudentSubnav
        items={[
          { href: "/progress/overview", label: "Обзор", active: true },
          { href: "/progress/topics", label: "Темы" },
          { href: "/progress/history", label: "История" },
          { href: "/progress/weak-points", label: "Слабые места" }
        ]}
      />
      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[2rem] border-[#dde2e9] bg-[linear-gradient(145deg,#ffffff_0%,#f7fbff_100%)] shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#45618e]">
                <Target className="h-3.5 w-3.5" />
                Что влияет на прогресс
              </span>
              <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-900">Прогресс растёт, когда вы доводите практику до конца</h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                На прогресс влияют завершённые уроки, сданные тесты и регулярное повторение слов. Если видите слабые места, лучше сразу перейти в
                практику и разобрать их отдельно.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-[#dde2e9] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#fff6e5] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#a46a00]">
                <Brain className="h-3.5 w-3.5" />
                Дальше по плану
              </span>
              <h2 className="text-xl font-black tracking-tight text-slate-900">
                {overview.weakPoints > 0 ? "Сначала закройте слабые места" : "Продолжайте практику и повторение"}
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                {overview.weakPoints > 0
                  ? `Сейчас обнаружено ${overview.weakPoints} слабых мест. Лучше начать с них, чтобы не тянуть ошибки дальше.`
                  : "Слабых мест почти нет. Поддерживайте темп через практику и регулярное повторение слов."}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link href={overview.weakPoints > 0 ? "/progress/weak-points" : "/practice/recommended"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#1f7aff] px-4 py-2 text-sm font-black text-white transition hover:bg-[#1669db]">
                {overview.weakPoints > 0 ? "Открыть слабые места" : "Продолжить обучение"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/words/review" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#dde2e9] bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:text-slate-900">
                Повторить слова
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StudentStatCard label="Завершено уроков" value={String(overview.completedLessons)} hint="по доступной практике" />
        <StudentStatCard label="Попыток" value={String(overview.totalAttempts)} hint="сданных тестов и тренажёров" />
        <StudentStatCard label="Средний балл" value={`${overview.averageScore}%`} hint="по завершённым попыткам" />
        <StudentStatCard label="Слабых мест" value={String(overview.weakPoints)} hint="по агрегированным ошибкам" />
      </div>
    </div>
  );
}
