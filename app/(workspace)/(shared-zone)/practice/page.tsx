import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Brain, PlayCircle, Sparkles } from "lucide-react";

import { StudentEmptyState, StudentPageHeader, StudentSubnav } from "@/app/(workspace)/_components/student-page-primitives";
import { Card, CardContent } from "@/components/ui/card";
import { getPracticeOverviewSummary, getPracticeRecommended, getPracticeTopics } from "@/lib/practice/queries";
import { measureServerTiming } from "@/lib/server/timing";

export default async function PracticePage() {
  const overview = await measureServerTiming("practice-route-context", () => getPracticeOverviewSummary());

  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader title="Практика" description="Тренируйтесь между уроками: продолжайте начатое, закрывайте слабые места и готовьтесь к следующему занятию." />
      <StudentSubnav
        items={[
          { href: "/practice", label: "Обзор", active: true },
          { href: "/practice/catalog", label: "Каталог" },
          { href: "/practice/recommended", label: "Рекомендовано" },
          { href: "/practice/topics", label: "Темы" },
          { href: "/practice/mistakes", label: "Ошибки" },
          { href: "/practice/favorites", label: "Избранное" }
        ]}
      />

      <section className="grid gap-5 xl:grid-cols-3">
        <Suspense fallback={<PracticeDoNowCard />}>
          <PracticeDoNowSlot doNowId={overview.doNowId} weakSpotId={overview.weakSpotId} />
        </Suspense>
        <Suspense fallback={<PracticeContinueTopicCard />}>
          <PracticeContinueTopicSlot continueTopicSlug={overview.continueTopicSlug} />
        </Suspense>
        <Suspense fallback={<PracticeWeakSpotCard />}>
          <PracticeWeakSpotSlot doNowId={overview.doNowId} weakSpotId={overview.weakSpotId} />
        </Suspense>
      </section>
    </div>
  );
}

async function PracticeDoNowSlot({ doNowId, weakSpotId }: { doNowId: string | null; weakSpotId: string | null }) {
  const recommended = await getPracticeRecommended();
  const doNow = recommended.find((item) => item.id === doNowId) ?? recommended.find((item) => item.id !== weakSpotId) ?? recommended[0] ?? null;
  return <PracticeDoNowCard item={doNow} />;
}

async function PracticeContinueTopicSlot({ continueTopicSlug }: { continueTopicSlug: string | null }) {
  const topics = await getPracticeTopics();
  const continueTopic = topics.find((topic) => topic.slug === continueTopicSlug) ?? topics[0] ?? null;
  return <PracticeContinueTopicCard topic={continueTopic} />;
}

async function PracticeWeakSpotSlot({ doNowId, weakSpotId }: { doNowId: string | null; weakSpotId: string | null }) {
  const recommended = await getPracticeRecommended();
  const weakSpot = recommended.find((item) => item.id === weakSpotId) ?? recommended.find((item) => item.id !== doNowId) ?? null;
  return <PracticeWeakSpotCard item={weakSpot} />;
}

function PracticeDoNowCard({
  item
}: {
  item?: {
    id: string;
    title: string;
    reason: string;
    activityType?: "trainer" | "test";
    cefrLevel?: string | null;
  } | null;
}) {
  return (
    <Card className="rounded-[2rem] border-[#dde2e9] bg-[linear-gradient(145deg,#ffffff_0%,#f7fbff_100%)] shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#45618e]">
              <PlayCircle className="h-3.5 w-3.5" />
              Сделать сейчас
            </span>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Главная практика на сегодня</h2>
          </div>
        </div>
        {item ? (
          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-[#dde2e9] bg-white px-4 py-4">
              <p className="text-lg font-black text-slate-900">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.reason}</p>
              {item.activityType ? <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{item.activityType === "trainer" ? "Тренажёр" : "Тест"} · {item.cefrLevel ?? "без уровня"}</p> : null}
            </div>
            <Link
              href={item.id.includes("_") ? `/practice/activity/${item.id}` : "/practice/recommended"}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#1f7aff] px-4 py-2 text-sm font-black text-white transition hover:bg-[#1669db]"
            >
              Продолжить обучение
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <StudentEmptyState title="Пока нет рекомендаций" description="После первых попыток и прогресса здесь появится главная практика на сегодня." />
        )}
      </CardContent>
    </Card>
  );
}

function PracticeContinueTopicCard({
  topic
}: {
  topic?: {
    slug: string;
    title: string;
    moduleCount: number;
    progressPercent: number;
  } | null;
}) {
  return (
    <Card className="rounded-[2rem] border-[#dde2e9] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#f4f7fb] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#5f6e8d]">
              <Sparkles className="h-3.5 w-3.5" />
              Продолжить начатое
            </span>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Тема, где вы уже двигаетесь</h2>
          </div>
        </div>
        {topic ? (
          <div className="space-y-4">
            <Link
              href={`/practice/topics/${topic.slug}`}
              className="block rounded-[1.5rem] border border-[#dde2e9] bg-[linear-gradient(145deg,#ffffff_0%,#f6f9ff_100%)] px-4 py-4 transition hover:border-[#cfd9e8]"
            >
              <p className="text-lg font-bold text-slate-900">{topic.title}</p>
              <p className="mt-1 text-sm text-slate-500">{topic.moduleCount} подтем</p>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#eef3fb]">
                <span className="block h-full rounded-full bg-[#1f7aff]" style={{ width: `${Math.max(6, topic.progressPercent)}%` }} />
              </div>
              <p className="mt-3 text-sm font-semibold text-indigo-600">{topic.progressPercent}% завершено</p>
            </Link>
            <Link href="/practice/topics" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              Все темы
            </Link>
          </div>
        ) : (
          <StudentEmptyState title="Темы пока не назначены" description="Когда студент будет записан на курс, здесь появится дерево доступной практики." />
        )}
      </CardContent>
    </Card>
  );
}

function PracticeWeakSpotCard({
  item
}: {
  item?: {
    title: string;
    reason: string;
    activityType?: "trainer" | "test";
    cefrLevel?: string | null;
  } | null;
}) {
  return (
    <Card className="rounded-[2rem] border-[#dde2e9] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#fff6e5] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#a46a00]">
              <Brain className="h-3.5 w-3.5" />
              Разобрать слабые места
            </span>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Что стоит подтянуть</h2>
          </div>
        </div>
        {item ? (
          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-[#f1e3be] bg-[#fffdf7] px-4 py-4">
              <p className="text-lg font-bold text-slate-900">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.reason}</p>
              {item.activityType ? <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{item.activityType === "trainer" ? "Тренажёр" : "Тест"} · {item.cefrLevel ?? "без уровня"}</p> : null}
            </div>
            <Link href="/practice/mistakes" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              Открыть ошибки
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <StudentEmptyState title="Слабых мест пока нет" description="Когда накопятся ошибки или спорные темы, здесь появится отдельный фокус для повторения." />
        )}
      </CardContent>
    </Card>
  );
}
