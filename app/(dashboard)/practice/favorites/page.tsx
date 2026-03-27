import { StudentEmptyState, StudentPageHeader, StudentSubnav } from "@/app/(dashboard)/_components/student-page-primitives";
import { Card, CardContent } from "@/components/ui/card";
import { getPracticeFavorites } from "@/lib/practice/queries";

export default async function PracticeFavoritesPage() {
  const favorites = await getPracticeFavorites();

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
