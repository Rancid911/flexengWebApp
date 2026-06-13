import { StudentSubnav } from "@/shared/ui/student-page-primitives";

export type ProgressSubnavItem = "overview" | "topics" | "history" | "weak-points";

export function ProgressSubnav({ active }: { active: ProgressSubnavItem }) {
  return (
    <StudentSubnav
      items={[
        { href: "/progress/overview", label: "Обзор", active: active === "overview" },
        { href: "/progress/topics", label: "Темы", active: active === "topics" },
        { href: "/progress/history", label: "История", active: active === "history" },
        { href: "/progress/weak-points", label: "Слабые места", active: active === "weak-points" }
      ]}
    />
  );
}
