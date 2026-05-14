import Link from "next/link";

import { StudentEmptyState } from "@/shared/ui/student-page-primitives";

export function WordsTrainEmptyState() {
  return (
    <div className="space-y-6 pb-8">
      <Link href="/words/my" className="text-sm font-black text-[#1f7aff]">
        Вернуться в карточки
      </Link>
      <StudentEmptyState title="Для этой тренировки нет слов" description="Выберите другую тему или режим на экране карточек." />
    </div>
  );
}
