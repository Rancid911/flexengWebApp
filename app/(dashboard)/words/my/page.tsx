import { StudentEmptyState, StudentPageHeader, StudentSubnav } from "@/app/(dashboard)/_components/student-page-primitives";
import { Card, CardContent } from "@/components/ui/card";
import { getStudentWords } from "@/lib/words/queries";

export default async function WordsMyPage() {
  const words = await getStudentWords();

  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader title="Мои слова" description="Сохранённые слова и выражения для регулярного повторения." />
      <StudentSubnav
        items={[
          { href: "/words/my", label: "Мои слова", active: true },
          { href: "/words/review", label: "Повторение" },
          { href: "/words/new", label: "Новые" }
        ]}
      />
      {words.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {words.map((item) => (
            <Card key={item.id} className="rounded-[1.8rem] border-[#dde2e9] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
              <CardContent className="space-y-2 p-5">
                <p className="text-2xl font-black tracking-tight text-slate-900">{item.term}</p>
                <p className="text-base text-slate-600">{item.translation}</p>
                <p className="text-sm font-semibold text-indigo-700">{item.status}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <StudentEmptyState title="Слов пока нет" description="Слова появятся после ручного добавления, ошибок в тестах и домашней работы." />
      )}
    </div>
  );
}
