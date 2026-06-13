import { Suspense } from "react";

import { getStudentDashboardSummary } from "@/lib/dashboard/student-dashboard";
import StudentPaymentReminderSlot from "@/features/dashboard/components/student-payment-reminder-slot";
import StudentDashboardView, {
  StudentDashboardRecommendationsSection,
  StudentDashboardScheduleSection,
  StudentDashboardSummaryStatsSection
} from "@/features/dashboard/components/student-dashboard-view";
import type { AppActor } from "@/lib/auth/request-context";
import { measureServerTiming } from "@/lib/server/timing";

async function StudentDashboardRecommendationsSlot({
  dataPromise
}: {
  dataPromise: Awaited<ReturnType<typeof getStudentDashboardSummary>>["secondaryDataPromise"];
}) {
  const data = await dataPromise;
  return <StudentDashboardRecommendationsSection recommendationCards={data.recommendationCards} />;
}

async function StudentDashboardScheduleSlot({
  dataPromise
}: {
  dataPromise: Awaited<ReturnType<typeof getStudentDashboardSummary>>["secondaryDataPromise"];
}) {
  const data = await dataPromise;
  return <StudentDashboardScheduleSection nextScheduledLesson={data.nextScheduledLesson} />;
}

async function StudentDashboardSummaryStatsSlot({
  dataPromise
}: {
  dataPromise: Awaited<ReturnType<typeof getStudentDashboardSummary>>["secondaryDataPromise"];
}) {
  const data = await dataPromise;
  return <StudentDashboardSummaryStatsSection summaryStats={data.summaryStats} />;
}

export async function renderStudentDashboardRoute(actor: AppActor) {
  const { initialData, secondaryDataPromise } = await measureServerTiming("student-dashboard-route-context", () => getStudentDashboardSummary(actor));

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
