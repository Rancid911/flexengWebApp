import Link from "next/link";

import { StudentEmptyState, StudentPageHeader, StudentSubnav } from "@/app/(dashboard)/_components/student-page-primitives";
import { getPracticeTopics } from "@/lib/practice/queries";

const topicAccents = [
  "bg-[linear-gradient(145deg,#eef5ff_0%,#dfeeff_100%)] text-[#163b7a]",
  "bg-[linear-gradient(145deg,#fff7d7_0%,#ffefb0_100%)] text-[#7a5200]",
  "bg-[linear-gradient(145deg,#e8fbf6_0%,#c9f3e5_100%)] text-[#155b4f]",
  "bg-[linear-gradient(145deg,#eef0ff_0%,#dde1ff_100%)] text-[#334391]"
];

export default async function PracticeTopicsPage() {
  const topics = await getPracticeTopics();

  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader title="Темы" description="Все доступные направления практики, сгруппированные по темам и прогрессу." />
      <StudentSubnav
        items={[
          { href: "/practice", label: "Обзор" },
          { href: "/practice/recommended", label: "Рекомендовано" },
          { href: "/practice/topics", label: "Темы", active: true },
          { href: "/practice/mistakes", label: "Ошибки" },
          { href: "/practice/favorites", label: "Избранное" }
        ]}
      />
      {topics.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {topics.map((topic, index) => (
            <Link
              key={topic.id}
              href={`/practice/topics/${topic.slug}`}
              className={`relative overflow-hidden rounded-[2rem] border border-white/60 px-5 py-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 ${topicAccents[index % topicAccents.length]}`}
            >
              <div className="space-y-2">
                <p className="text-sm opacity-80">Прогресс</p>
                <h2 className="text-3xl font-black tracking-tight">{topic.title}</h2>
                <p className="text-sm opacity-80">{topic.progressPercent}% завершено</p>
              </div>
              <div className="mt-8 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold opacity-80">{topic.moduleCount} подтем</span>
                <span className="inline-flex min-h-10 items-center rounded-2xl bg-white/80 px-4 py-2 text-sm font-bold text-slate-900">
                  Открыть
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <StudentEmptyState title="Нет доступных тем" description="После назначения курса появятся темы и прогресс по ним." />
      )}
    </div>
  );
}
