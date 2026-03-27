import { StudentPageHeader, StudentStatCard, StudentSubnav } from "@/app/(dashboard)/_components/student-page-primitives";
import { getProgressOverview } from "@/lib/progress/queries";

export default async function ProgressOverviewPage() {
  const overview = await getProgressOverview();
  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader title="Прогресс" description="Общая картина по самостоятельной практике, тестам и слабым местам." />
      <StudentSubnav
        items={[
          { href: "/progress/overview", label: "Обзор", active: true },
          { href: "/progress/topics", label: "Темы" },
          { href: "/progress/history", label: "История" },
          { href: "/progress/weak-points", label: "Слабые места" }
        ]}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StudentStatCard label="Завершено уроков" value={String(overview.completedLessons)} hint="по доступной практике" />
        <StudentStatCard label="Попыток" value={String(overview.totalAttempts)} hint="сданных тестов и тренажёров" />
        <StudentStatCard label="Средний балл" value={`${overview.averageScore}%`} hint="по завершённым попыткам" />
        <StudentStatCard label="Слабых мест" value={String(overview.weakPoints)} hint="по агрегированным ошибкам" />
      </div>
    </div>
  );
}
