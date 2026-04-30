import { Suspense } from "react";

import {
  getStudentDashboardInitialData,
  getStudentDashboardSecondaryData
} from "@/lib/dashboard/student-dashboard";
import StudentPaymentReminderSlot from "@/app/(workspace)/(shared-zone)/dashboard/student-payment-reminder-slot";
import StudentDashboardView, {
  StudentDashboardRecommendationsSection,
  StudentDashboardScheduleSection,
  StudentDashboardSummaryStatsSection
} from "@/app/(workspace)/(shared-zone)/dashboard/student-dashboard-view";
import { measureServerTiming } from "@/lib/server/timing";

async function StudentDashboardRecommendationsSlot({
  dataPromise
}: {
  dataPromise: ReturnType<typeof getStudentDashboardSecondaryData>;
}) {
  const data = await dataPromise;
  return <StudentDashboardRecommendationsSection recommendationCards={data.recommendationCards} />;
}

async function StudentDashboardScheduleSlot({
  dataPromise
}: {
  dataPromise: ReturnType<typeof getStudentDashboardSecondaryData>;
}) {
  const data = await dataPromise;
  return <StudentDashboardScheduleSection nextScheduledLesson={data.nextScheduledLesson} />;
}

async function StudentDashboardSummaryStatsSlot({
  dataPromise
}: {
  dataPromise: ReturnType<typeof getStudentDashboardSecondaryData>;
}) {
  const data = await dataPromise;
  return <StudentDashboardSummaryStatsSection summaryStats={data.summaryStats} />;
}

export async function renderStudentDashboardRoute() {
  const data = await measureServerTiming("student-dashboard-route-context", () => getStudentDashboardInitialData());
  const secondaryDataPromise = getStudentDashboardSecondaryData();

  return (
    <>
      <StudentDashboardView
        data={data}
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
