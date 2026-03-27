import { StudentEmptyState, StudentPageHeader, StudentSubnav } from "@/app/(dashboard)/_components/student-page-primitives";
import { Card, CardContent } from "@/components/ui/card";
import { getNewWords } from "@/lib/words/queries";

export default async function WordsNewPage() {
  const words = await getNewWords();

  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader title="Новые слова" description="Недавно добавленные слова, которые ещё не закреплены в повторении." />
      <StudentSubnav
        items={[
          { href: "/words/my", label: "Мои слова" },
          { href: "/words/review", label: "Повторение" },
          { href: "/words/new", label: "Новые", active: true }
        ]}
      />
      {words.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
        <StudentEmptyState title="Новых слов пока нет" description="Когда появятся свежие слова из homework или ошибок, они будут показаны здесь." />
      )}
    </div>
  );
}
