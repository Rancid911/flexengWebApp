import { StudentEmptyState, StudentPageHeader, StudentSubnav } from "@/app/(dashboard)/_components/student-page-primitives";
import { Card, CardContent } from "@/components/ui/card";
import { getWordsForReview } from "@/lib/words/queries";

export default async function WordsReviewPage() {
  const words = await getWordsForReview();

  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader title="Повторение слов" description="Очередь слов, которые уже пора повторить." />
      <StudentSubnav
        items={[
          { href: "/words/my", label: "Мои слова" },
          { href: "/words/review", label: "Повторение", active: true },
          { href: "/words/new", label: "Новые" }
        ]}
      />
      {words.length > 0 ? (
        <div className="space-y-4">
          {words.map((item) => (
            <Card key={item.id} className="rounded-[1.8rem] border-[#dde2e9] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
              <CardContent className="space-y-2 p-5">
                <p className="text-2xl font-black tracking-tight text-slate-900">{item.term}</p>
                <p className="text-base text-slate-600">{item.translation}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <StudentEmptyState title="На сегодня всё повторено" description="Новые слова для повторения появятся автоматически по расписанию." />
      )}
    </div>
  );
}
