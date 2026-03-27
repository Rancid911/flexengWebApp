import Link from "next/link";

import { StudentEmptyState, StudentPageHeader, StudentSubnav } from "@/app/(dashboard)/_components/student-page-primitives";
import { Card, CardContent } from "@/components/ui/card";
import { getPracticeRecommended, getPracticeTopics } from "@/lib/practice/queries";

export default async function PracticePage() {
  const [recommended, topics] = await Promise.all([getPracticeRecommended(), getPracticeTopics()]);

  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader title="Практика" description="Каталог самостоятельной практики между уроками: рекомендации, темы, ошибки и избранное." />
      <StudentSubnav
        items={[
          { href: "/practice", label: "Обзор", active: true },
          { href: "/practice/recommended", label: "Рекомендовано" },
          { href: "/practice/topics", label: "Темы" },
          { href: "/practice/mistakes", label: "Ошибки" },
          { href: "/practice/favorites", label: "Избранное" }
        ]}
      />

      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-[2rem] border-[#dde2e9] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black tracking-tight text-slate-900">Рекомендовано</h2>
              <Link href="/practice/recommended" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                Открыть все
              </Link>
            </div>
            {recommended.length > 0 ? (
              <div className="space-y-3">
                {recommended.slice(0, 3).map((item, index) => (
                  <Link
                    key={`${item.id}-${index}`}
                    href={item.id.includes("_") ? `/practice/activity/${item.id}` : "/practice/recommended"}
                    className="block rounded-[1.4rem] border border-[#dde2e9] bg-white px-4 py-4 transition hover:bg-[#f9fbff]"
                  >
                    <p className="font-bold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.reason}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <StudentEmptyState title="Пока нет рекомендаций" description="Рекомендации появятся после первых попыток и накопления прогресса по темам." />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-[#dde2e9] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black tracking-tight text-slate-900">Темы</h2>
              <Link href="/practice/topics" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                Все темы
              </Link>
            </div>
            {topics.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {topics.slice(0, 4).map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/practice/topics/${topic.slug}`}
                    className="rounded-[1.5rem] border border-[#dde2e9] bg-[linear-gradient(145deg,#ffffff_0%,#f6f9ff_100%)] px-4 py-4 transition hover:border-[#cfd9e8]"
                  >
                    <p className="text-lg font-bold text-slate-900">{topic.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{topic.moduleCount} подтем</p>
                    <p className="mt-3 text-sm font-semibold text-indigo-600">{topic.progressPercent}% завершено</p>
                  </Link>
                ))}
              </div>
            ) : (
              <StudentEmptyState title="Темы пока не назначены" description="Когда студент будет записан на курс, здесь появится дерево доступной практики." />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
