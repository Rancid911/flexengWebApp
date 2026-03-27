import { StudentEmptyState, StudentPageHeader, StudentSubnav } from "@/app/(dashboard)/_components/student-page-primitives";
import { Card, CardContent } from "@/components/ui/card";
import { getProgressByTopics } from "@/lib/progress/queries";

export default async function ProgressTopicsPage() {
  const topics = await getProgressByTopics();
  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader title="Прогресс по темам" description="Разбивка самостоятельной практики по основным направлениям обучения." />
      <StudentSubnav
        items={[
          { href: "/progress/overview", label: "Обзор" },
          { href: "/progress/topics", label: "Темы", active: true },
          { href: "/progress/history", label: "История" },
          { href: "/progress/weak-points", label: "Слабые места" }
        ]}
      />
      {topics.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {topics.map((topic) => (
            <Card key={topic.id} className="rounded-[1.8rem] border-[#dde2e9] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
              <CardContent className="space-y-2 p-5">
                <p className="text-xl font-black tracking-tight text-slate-900">{topic.title}</p>
                <p className="text-4xl font-black tracking-tight text-indigo-700">{topic.progressPercent}%</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <StudentEmptyState title="Темы пока не накопили прогресс" description="Когда появится завершённая практика, здесь отобразится прогресс по направлениям." />
      )}
    </div>
  );
}
