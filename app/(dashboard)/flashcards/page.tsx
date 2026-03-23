import { BookMarked, Brain, Sparkles } from "lucide-react";
import { type ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

export default function FlashcardsPage() {
  return (
    <div className="space-y-6 pb-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Тренировка словаря</h1>
        <p className="text-base text-slate-600">Скоро здесь будет полноценный режим флешкарточек с повторением и статистикой.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <FeatureCard
          icon={<BookMarked className="h-5 w-5 text-indigo-700" />}
          title="Наборы по темам"
          text="Фразы для работы, путешествий и ежедневного общения."
        />
        <FeatureCard
          icon={<Brain className="h-5 w-5 text-indigo-700" />}
          title="Умное повторение"
          text="Интервалы повторения для закрепления новых слов."
        />
        <FeatureCard
          icon={<Sparkles className="h-5 w-5 text-indigo-700" />}
          title="Быстрые сессии"
          text="Короткие тренировки по 5–10 минут каждый день."
        />
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Card className="rounded-3xl border-[#dde2e9] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
      <CardContent className="space-y-3 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100">{icon}</div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600">{text}</p>
      </CardContent>
    </Card>
  );
}
