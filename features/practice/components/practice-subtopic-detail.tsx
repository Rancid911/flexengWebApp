import Link from "next/link";

import type { getPracticeSubtopicDetail } from "@/lib/practice/queries";
import { StudentEmptyState, StudentPageHeader } from "@/shared/ui/student-page-primitives";

type PracticeSubtopicDetailPayload = NonNullable<Awaited<ReturnType<typeof getPracticeSubtopicDetail>>>;

export function PracticeSubtopicDetail({ payload }: { payload: PracticeSubtopicDetailPayload }) {
  return (
    <div className="space-y-6 pb-8">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link href="/practice/topics" className="hover:text-slate-900">
            Темы
          </Link>
          <span>→</span>
          <Link href={`/practice/topics/${payload.topic.slug}`} className="hover:text-slate-900">
            {payload.topic.title}
          </Link>
          <span>→</span>
          <span className="text-slate-900">{payload.subtopic.title}</span>
        </div>
        <StudentPageHeader title={payload.subtopic.title} description={payload.subtopic.description ?? "Выберите активность для самостоятельной работы."} />
      </div>
      {payload.activities.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-3">
          {payload.activities.map((activity) => (
            <Link
              key={activity.id}
              href={`/practice/activity/${activity.id}`}
              className="rounded-[1.8rem] border border-[#dde2e9] bg-white px-5 py-5 shadow-[0_10px_26px_rgba(15,23,42,0.05)] transition hover:border-slate-300"
            >
              <div className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-indigo-700">
                {activity.kind === "trainer" ? "Тренажёр" : "Тест"}
              </div>
              <h2 className="mt-4 text-xl font-black tracking-tight text-slate-900">{activity.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{activity.description ?? "Описание будет доступно позже."}</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Длительность</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{activity.durationLabel}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Статус</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{activity.progressLabel}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <StudentEmptyState title="Активностей пока нет" description="Здесь будут тесты, тренажёры и практические задания по выбранной подтеме." />
      )}
    </div>
  );
}
