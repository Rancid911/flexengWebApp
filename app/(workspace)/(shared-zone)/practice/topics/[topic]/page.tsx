import Link from "next/link";
import { notFound } from "next/navigation";

import { StudentEmptyState, StudentPageHeader, StudentSubnav } from "@/app/(workspace)/_components/student-page-primitives";
import { getPracticeTopicDetail } from "@/lib/practice/queries";

const subtopicAccent = {
  card:
    "border-[#e5eee5] bg-[#fbfefb] text-slate-950 shadow-[0_18px_40px_rgba(76,98,76,0.09)] hover:border-[#cfe0cf] hover:shadow-[0_22px_46px_rgba(76,98,76,0.14)]",
  title: "text-slate-950",
  description: "text-slate-600",
  metric: "bg-[#f0f7f0] text-slate-950 ring-1 ring-[#dfeadf]",
  metricLabel: "text-slate-500"
};

export default async function PracticeTopicDetailPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const payload = await getPracticeTopicDetail(topic);
  if (!payload) notFound();

  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader title={payload.topic.title} description={payload.topic.description ?? "Подтемы и активности для самостоятельной практики."} />
      <StudentSubnav
        items={[
          { href: "/practice", label: "Обзор" },
          { href: "/practice/catalog", label: "Каталог" },
          { href: "/practice/topics", label: "Темы", active: true },
          { href: "/practice/mistakes", label: "Ошибки" },
          { href: "/practice/favorites", label: "Избранное" }
        ]}
      />
      {payload.subtopics.length > 0 ? (
        <div className="grid items-stretch gap-4 lg:grid-cols-3">
          {payload.subtopics.map((item) => {
            return (
              <Link
                key={item.id}
                href={`/practice/topics/${payload.topic.slug}/${item.id}`}
                className={`group relative flex h-full min-h-[190px] flex-col overflow-hidden rounded-[1.8rem] border px-5 py-5 transition duration-200 hover:-translate-y-0.5 ${subtopicAccent.card}`}
              >
                <span aria-hidden className="pointer-events-none absolute inset-x-5 top-0 h-px bg-white" />
                <div className="relative z-10 flex h-full flex-col">
                  <h2 className={`text-xl font-black tracking-tight ${subtopicAccent.title}`}>{item.title}</h2>
                  <p className={`mt-2 text-sm ${subtopicAccent.description}`}>{item.description ?? "Подтема без описания."}</p>
                  <div className="mt-auto grid grid-cols-2 gap-3 pt-5 text-center">
                    <div className={`rounded-2xl px-3 py-3 ${subtopicAccent.metric}`}>
                      <p className="text-lg font-black">{item.testCount}</p>
                      <p className={`text-xs font-semibold ${subtopicAccent.metricLabel}`}>тестов</p>
                    </div>
                    <div className={`rounded-2xl px-3 py-3 ${subtopicAccent.metric}`}>
                      <p className="text-lg font-black">{item.progressPercent}%</p>
                      <p className={`text-xs font-semibold ${subtopicAccent.metricLabel}`}>прогресс</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <StudentEmptyState title="Подтемы пока не опубликованы" description="Когда преподаватель или администратор подготовят содержимое, оно появится здесь." />
      )}
    </div>
  );
}
