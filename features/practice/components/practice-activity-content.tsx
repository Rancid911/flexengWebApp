import { StudentPageHeader } from "@/shared/ui/student-page-primitives";
import { Card, CardContent } from "@/components/ui/card";
import { PlacementTestFlow } from "@/features/practice/components/placement-test-flow";
import { PracticeTestRunner } from "@/features/practice/components/practice-test-runner";
import type { PracticeActivityDetail } from "@/lib/practice/queries";

type PracticeActivityContentProps = {
  payload: PracticeActivityDetail;
};

export function PracticeActivityContent({ payload }: PracticeActivityContentProps) {
  return (
    <div className="space-y-6 pb-8">
      {payload.sourceType === "lesson" ? (
        <StudentPageHeader title={payload.title} description={payload.description ?? "Активность для самостоятельной практики."} />
      ) : null}
      {payload.sourceType === "lesson" ? (
        <Card className="rounded-[2rem] border-[#dde2e9] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
          <CardContent className="space-y-6 p-6">
            <div className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-indigo-700">Практика</div>
            <p className="text-sm font-semibold text-slate-500">{payload.meta}</p>
            <pre className="overflow-x-auto rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-700">{JSON.stringify(payload.content, null, 2)}</pre>
          </CardContent>
        </Card>
      ) : payload.assessmentKind === "placement" ? (
        <PlacementTestFlow payload={payload} />
      ) : (
        <PracticeTestRunner payload={payload} />
      )}
    </div>
  );
}
