import { notFound } from "next/navigation";

import { StudentPageHeader } from "@/app/(dashboard)/_components/student-page-primitives";
import { Card, CardContent } from "@/components/ui/card";
import { getPracticeActivityDetail } from "@/lib/practice/queries";

export default async function PracticeActivityPage({ params }: { params: Promise<{ activityId: string }> }) {
  const { activityId } = await params;
  const payload = await getPracticeActivityDetail(activityId);
  if (!payload) notFound();

  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader title={payload.title} description={payload.description ?? "Активность для самостоятельной практики."} />
      <Card className="rounded-[2rem] border-[#dde2e9] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
        <CardContent className="space-y-6 p-6">
          <div className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-indigo-700">
            {payload.sourceType === "test" ? "Тест" : "Практика"}
          </div>
          <p className="text-sm font-semibold text-slate-500">{payload.meta}</p>
          {payload.sourceType === "lesson" ? (
            <pre className="overflow-x-auto rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-700">{JSON.stringify(payload.content, null, 2)}</pre>
          ) : (
            <div className="space-y-3">
              {(payload.content as Array<{ id: string; prompt: string; explanation: string | null; question_type: string }>).map((question, index) => (
                <div key={question.id} className="rounded-[1.5rem] border border-[#dde2e9] bg-white px-4 py-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">Вопрос {index + 1}</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">{question.prompt}</p>
                  <p className="mt-2 text-sm text-slate-500">{question.explanation ?? question.question_type}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
