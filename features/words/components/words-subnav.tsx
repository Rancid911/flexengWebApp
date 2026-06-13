import { StudentSubnav } from "@/shared/ui/student-page-primitives";

export type WordsSubnavItem = "my" | "review" | "new" | "difficult";

export function WordsSubnav({ active }: { active: WordsSubnavItem }) {
  return (
    <StudentSubnav
      items={[
        { href: "/words", label: "Карточки", active: active === "my" },
        { href: "/words/review", label: "Повторение", active: active === "review" },
        { href: "/words/new", label: "Новые", active: active === "new" },
        { href: "/words/difficult", label: "Сложные", active: active === "difficult" }
      ]}
    />
  );
}
