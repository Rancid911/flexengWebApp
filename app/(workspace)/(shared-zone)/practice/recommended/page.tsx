import Link from "next/link";

import { StudentEmptyState, StudentPageHeader, StudentSubnav } from "@/app/(workspace)/_components/student-page-primitives";
import { Card, CardContent } from "@/components/ui/card";
import { getPracticeRecommended } from "@/lib/practice/queries";

export default async function PracticeRecommendedPage() {
  const recommended = await getPracticeRecommended();

  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader title="Рекомендовано" description="Подборка активностей на основе прогресса, незавершённых тем и частых ошибок." />
      <StudentSubnav
        items={[
          { href: "/practice", label: "Обзор" },
          { href: "/practice/catalog", label: "Каталог" },
          { href: "/practice/recommended", label: "Рекомендовано", active: true },
          { href: "/practice/topics", label: "Темы" },
          { href: "/practice/mistakes", label: "Ошибки" },
          { href: "/practice/favorites", label: "Избранное" }
        ]}
      />
      {recommended.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {recommended.map((item, index) => (
            <Card key={`${item.id}-${index}`} className="rounded-[2rem] border-[#dde2e9] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
              <CardContent className="space-y-4 p-6">
                <div className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-indigo-700">
                  {item.activityType === "trainer" ? "Тренажёр" : item.activityType === "test" ? "Тест" : "Рекомендовано"}
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900">{item.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{item.reason}</p>
                  {(item.cefrLevel || item.drillTopicKey) ? (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {item.cefrLevel ?? "без уровня"}
                      {item.drillTopicKey ? ` · ${item.drillTopicKey}` : ""}
                      {item.drillKind ? ` · ${item.drillKind}` : ""}
                    </p>
                  ) : null}
                </div>
                <Link
                  href={item.id.includes("_") ? `/practice/activity/${item.id}` : "/practice/topics"}
                  className="inline-flex min-h-11 items-center rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Открыть
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <StudentEmptyState title="Рекомендаций пока нет" description="Появятся после первых результатов по тестам и практическим активностям." />
      )}
    </div>
  );
}
