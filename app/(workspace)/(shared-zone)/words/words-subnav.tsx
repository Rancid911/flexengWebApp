import { StudentSubnav } from "@/app/(workspace)/_components/student-page-primitives";

export function WordsSubnav({ active }: { active: "my" | "review" | "new" | "difficult" }) {
  return (
    <StudentSubnav
      items={[
        { href: "/words/my", label: "Карточки", active: active === "my" },
        { href: "/words/review", label: "Повторение", active: active === "review" },
        { href: "/words/new", label: "Новые", active: active === "new" },
        { href: "/words/difficult", label: "Сложные", active: active === "difficult" }
      ]}
    />
  );
}
