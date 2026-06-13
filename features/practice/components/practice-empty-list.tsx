import { Card, CardContent } from "@/components/ui/card";
import type { getPracticeFavorites, getPracticeMistakes } from "@/lib/practice/queries";
import { StudentEmptyState, StudentPageHeader, StudentSubnav } from "@/shared/ui/student-page-primitives";

type PracticeMistakes = Awaited<ReturnType<typeof getPracticeMistakes>>;
type PracticeFavorites = Awaited<ReturnType<typeof getPracticeFavorites>>;

export function PracticeMistakesList({ mistakes }: { mistakes: PracticeMistakes }) {
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

export function PracticeFavoritesList({ favorites }: { favorites: PracticeFavorites }) {
  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader title="Избранное" description="Сохранённые темы, подтемы и активности для быстрого доступа." />
      <StudentSubnav
        items={[
          { href: "/practice", label: "Обзор" },
          { href: "/practice/recommended", label: "Рекомендовано" },
          { href: "/practice/topics", label: "Темы" },
          { href: "/practice/mistakes", label: "Ошибки" },
          { href: "/practice/favorites", label: "Избранное", active: true }
        ]}
      />
      {favorites.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {favorites.map((item, index) => (
            <Card key={`${item.id}-${index}`} className="rounded-[1.8rem] border-[#dde2e9] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
              <CardContent className="space-y-2 p-5">
                <p className="text-xs font-black uppercase tracking-wide text-indigo-700">{item.entityType}</p>
                <p className="text-base font-bold text-slate-900">{item.entityId}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <StudentEmptyState title="Избранного пока нет" description="Сохранённые элементы появятся здесь, когда будет подключён toggle на страницах практики." />
      )}
    </div>
  );
}
