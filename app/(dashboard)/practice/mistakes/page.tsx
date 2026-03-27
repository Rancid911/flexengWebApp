import { StudentEmptyState, StudentPageHeader, StudentSubnav } from "@/app/(dashboard)/_components/student-page-primitives";
import { Card, CardContent } from "@/components/ui/card";
import { getPracticeMistakes } from "@/lib/practice/queries";

export default async function PracticeMistakesPage() {
  const mistakes = await getPracticeMistakes();

  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader title="Ошибки" description="Список тем и активностей, в которых чаще всего встречаются затруднения." />
      <StudentSubnav
        items={[
          { href: "/practice", label: "Обзор" },
          { href: "/practice/recommended", label: "Рекомендовано" },
          { href: "/practice/topics", label: "Темы" },
          { href: "/practice/mistakes", label: "Ошибки", active: true },
          { href: "/practice/favorites", label: "Избранное" }
        ]}
      />
      {mistakes.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-3">
          {mistakes.map((item, index) => (
            <Card key={`${item.id}-${index}`} className="rounded-[1.8rem] border-[#dde2e9] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
              <CardContent className="space-y-3 p-5">
                <h2 className="text-xl font-black tracking-tight text-slate-900">{item.title}</h2>
                <p className="text-sm text-slate-600">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <StudentEmptyState title="Ошибок пока нет" description="После первых попыток здесь появятся зоны, которые стоит повторить." />
      )}
    </div>
  );
}
