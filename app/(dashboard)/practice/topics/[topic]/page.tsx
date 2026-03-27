import Link from "next/link";
import { notFound } from "next/navigation";

import { StudentEmptyState, StudentPageHeader, StudentSubnav } from "@/app/(dashboard)/_components/student-page-primitives";
import { getPracticeTopicDetail } from "@/lib/practice/queries";

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
          { href: "/practice/topics", label: "Темы", active: true },
          { href: "/practice/mistakes", label: "Ошибки" },
          { href: "/practice/favorites", label: "Избранное" }
        ]}
      />
      {payload.subtopics.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {payload.subtopics.map((item) => (
            <Link
              key={item.id}
              href={`/practice/topics/${payload.topic.slug}/${item.id}`}
              className="rounded-[1.8rem] border border-[#dde2e9] bg-white px-5 py-5 shadow-[0_10px_26px_rgba(15,23,42,0.05)] transition hover:border-slate-300"
            >
              <h2 className="text-xl font-black tracking-tight text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{item.description ?? "Подтема без описания."}</p>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-slate-50 px-3 py-3">
                  <p className="text-lg font-black text-slate-900">{item.lessonCount}</p>
                  <p className="text-xs font-semibold text-slate-500">уроков</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-3">
                  <p className="text-lg font-black text-slate-900">{item.testCount}</p>
                  <p className="text-xs font-semibold text-slate-500">тестов</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-3">
                  <p className="text-lg font-black text-slate-900">{item.progressPercent}%</p>
                  <p className="text-xs font-semibold text-slate-500">прогресс</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <StudentEmptyState title="Подтемы пока не опубликованы" description="Когда преподаватель или администратор подготовят содержимое, оно появится здесь." />
      )}
    </div>
  );
}
