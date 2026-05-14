import { Suspense } from "react";

import { getStudentDashboardRouteData } from "@/lib/dashboard/student-dashboard";
import StudentPaymentReminderSlot from "@/features/dashboard/components/student-payment-reminder-slot";
import StudentDashboardView, {
  StudentDashboardRecommendationsSection,
  StudentDashboardScheduleSection,
  StudentDashboardSummaryStatsSection
} from "@/features/dashboard/components/student-dashboard-view";
import { measureServerTiming } from "@/lib/server/timing";

async function StudentDashboardRecommendationsSlot({
  dataPromise
}: {
  dataPromise: Awaited<ReturnType<typeof getStudentDashboardRouteData>>["secondaryDataPromise"];
}) {
  const data = await dataPromise;
  return <StudentDashboardRecommendationsSection recommendationCards={data.recommendationCards} />;
}

async function StudentDashboardScheduleSlot({
  dataPromise
}: {
  dataPromise: Awaited<ReturnType<typeof getStudentDashboardRouteData>>["secondaryDataPromise"];
}) {
  const data = await dataPromise;
  return <StudentDashboardScheduleSection nextScheduledLesson={data.nextScheduledLesson} />;
}

async function StudentDashboardSummaryStatsSlot({
  dataPromise
}: {
  dataPromise: Awaited<ReturnType<typeof getStudentDashboardRouteData>>["secondaryDataPromise"];
}) {
  const data = await dataPromise;
  return <StudentDashboardSummaryStatsSection summaryStats={data.summaryStats} />;
}

export async function renderStudentDashboardRoute() {
  const { initialData, secondaryDataPromise } = await measureServerTiming("student-dashboard-route-context", () => getStudentDashboardRouteData());

  return (
    <>
      <StudentDashboardView
        data={initialData}
        recommendationsSlot={
          <Suspense fallback={<StudentDashboardRecommendationsSection recommendationCards={[]} />}>
            <StudentDashboardRecommendationsSlot dataPromise={secondaryDataPromise} />
          </Suspense>
        }
        scheduleSlot={
          <Suspense fallback={<StudentDashboardScheduleSection nextScheduledLesson={null} />}>
            <StudentDashboardScheduleSlot dataPromise={secondaryDataPromise} />
          </Suspense>
        }
        summaryStatsSlot={
          <Suspense fallback={<StudentDashboardSummaryStatsSection summaryStats={[]} />}>
            <StudentDashboardSummaryStatsSlot dataPromise={secondaryDataPromise} />
          </Suspense>
        }
      />
      <Suspense fallback={null}>
        <StudentPaymentReminderSlot />
      </Suspense>
    </>
  );
}
