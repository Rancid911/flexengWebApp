"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type GoalId = "career" | "everyday" | "exam";

type Plan = {
  id: string;
  badge: string;
  title: string;
  price: string;
  unit: string;
  features: string[];
  featured?: boolean;
};

type GoalConfig = {
  id: GoalId;
  label: string;
  subtitle: string;
  plans: [Plan, Plan, Plan];
};

const goals: GoalConfig[] = [
  {
    id: "career",
    label: "Бизнес",
    subtitle: "Для роста в карьере и уверенной рабочей коммуникации",
    plans: [
      {
        id: "career-start",
        badge: "Для старта",
        title: "Индивидуальный старт",
        price: "от 1290 ₽",
        unit: "/ урок",
        features: ["Индивидуальные занятия 1:1", "Проверка домашних заданий", "Еженедельный мини-прогресс", "2 переноса занятий в месяц"]
      },
      {
        id: "career-pro",
        badge: "Оптимальный",
        title: "Разговорный PRO",
        price: "от 1790 ₽",
        unit: "/ урок",
        features: ["Всё из Start", "Разговорный клуб 1 раз в неделю", "12-недельный карьерный план", "Приоритетная поддержка"]
      },
      {
        id: "career-focus",
        badge: "Популярно",
        title: "Фокус-программа",
        price: "от 11 900 ₽",
        unit: "/ месяц",
        features: [
          "8–10 занятий в месяц",
          "Индивидуальные + разговорная практика",
          "Контроль прогресса под рабочие цели",
          "Персональный куратор",
          "AI-тренажер устной речи"
        ],
        featured: true
      }
    ]
  },
  {
    id: "everyday",
    label: "На каждый день",
    subtitle: "Для свободного общения в путешествиях и повседневной жизни",
    plans: [
      {
        id: "everyday-start",
        badge: "Для старта",
        title: "Индивидуальный старт",
        price: "от 1190 ₽",
        unit: "/ урок",
        features: ["Индивидуальные занятия 1:1", "Практика разговорных сценариев", "Проверка домашних заданий", "2 переноса занятий в месяц"]
      },
      {
        id: "everyday-pro",
        badge: "Оптимальный",
        title: "Разговорный PRO",
        price: "от 1650 ₽",
        unit: "/ урок",
        features: ["Всё из Start", "Разговорный клуб 1 раз в неделю", "Тематические speaking-сессии", "Личный трек прогресса"]
      },
      {
        id: "everyday-focus",
        badge: "Популярно",
        title: "Фокус-программа",
        price: "от 10 900 ₽",
        unit: "/ месяц",
        features: [
          "8–10 занятий в месяц",
          "Комбинация индивидуальных и speaking-уроков",
          "Регулярный контроль словаря и fluency",
          "Персональный куратор",
          "AI-тренажер устной речи"
        ],
        featured: true
      }
    ]
  },
  {
    id: "exam",
    label: "Экзамены",
    subtitle: "Для системной подготовки к экзаменам и измеримого результата",
    plans: [
      {
        id: "exam-start",
        badge: "Для старта",
        title: "Экзамен-старт",
        price: "от 1390 ₽",
        unit: "/ урок",
        features: ["Индивидуальные занятия 1:1", "База формата экзамена", "Проверка письменных заданий", "2 переноса занятий в месяц"]
      },
      {
        id: "exam-pro",
        badge: "Оптимальный",
        title: "Экзамен PRO",
        price: "от 1890 ₽",
        unit: "/ урок",
        features: ["Всё из Start", "Пробные тесты с разбором", "Стратегия по слабым блокам", "Приоритетная поддержка"]
      },
      {
        id: "exam-focus",
        badge: "Популярно",
        title: "Фокус-программа",
        price: "от 12 400 ₽",
        unit: "/ месяц",
        features: ["8–10 занятий в месяц", "Индивидуальная траектория под экзамен", "Еженедельный пробный блок", "Персональный куратор", "AI-тренажер speaking/grammar"],
        featured: true
      }
    ]
  }
];

function PriceCard({ plan, large = false }: { plan: Plan; large?: boolean }) {
  const visibleFeatures = plan.features.slice(0, 3);

  return (
    <article
      className={cn(
        "flex h-full w-full flex-col rounded-2xl border p-4 md:p-5 lg:h-[430px]",
        large
          ? "border-[#5E558F] bg-[linear-gradient(160deg,#433A6A_0%,#4F467D_45%,#3D355F_100%)] text-white shadow-[0_20px_48px_rgba(34,24,63,0.28)]"
          : "border-[#E3DEEF] bg-white/90 text-[#322F55] shadow-sm"
      )}
    >
      <span
        className={cn(
          "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
          large ? "bg-[#C9BAFF] text-[#352C58]" : "bg-[#EEE8FF] text-[#654ED6]"
        )}
      >
        {plan.badge}
      </span>
      <h3 className="mt-3 text-2xl font-bold leading-tight md:text-[28px]">{plan.title}</h3>
      <p className={cn("mt-2 text-xl font-bold md:text-2xl", large ? "text-white" : "text-[#2E1065]")}>
        {plan.price} <span className={cn("text-lg font-medium", large ? "text-[#D8D0FF]" : "text-[#706E88]")}>{plan.unit}</span>
      </p>

      <div className={cn("my-4 h-px w-full", large ? "bg-[#6E65A7]" : "bg-[#E8E1F8]")} />

      <ul className="flex-1 space-y-2 overflow-hidden">
        {visibleFeatures.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <Check className={cn("mt-0.5 h-4 w-4 shrink-0", large ? "text-[#C9BAFF]" : "text-[#7C3AED]")} />
            <span className={cn("text-sm leading-relaxed", large ? "text-[#E4DEFF]" : "text-[#5D597A]")}>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        className={cn(
          "mt-4 h-10 w-full rounded-xl text-sm font-semibold",
          large ? "bg-white text-[#4C1D95] hover:bg-[#F2EEFF]" : "bg-[#433A6A] text-white hover:bg-[#3A315C]"
        )}
      >
        Выбрать формат
      </Button>
    </article>
  );
}

export function PricingSection() {
  const [goalId, setGoalId] = useState<GoalId>("career");
  const current = useMemo(() => goals.find((goal) => goal.id === goalId) ?? goals[0], [goalId]);
  const startPlan = current.plans.find((plan) => plan.id.includes("start")) ?? current.plans[0];
  const proPlan = current.plans.find((plan) => plan.id.includes("pro")) ?? current.plans[1];
  const focusPlan = current.plans.find((plan) => plan.id.includes("focus")) ?? current.plans[2];

  return (
    <section id="pricing" className="scroll-mt-16 mx-auto w-full max-w-6xl px-4 py-10 sm:scroll-mt-20 sm:px-6 lg:scroll-mt-24 lg:px-8">
      <div className="mb-5 space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-[#322F55] sm:text-3xl">Тарифы и форматы обучения</h2>
        <p className="text-sm text-[#706E88] sm:text-base">{current.subtitle}</p>
      </div>

      <Tabs value={goalId} onValueChange={(value) => setGoalId(value as GoalId)} className="mb-6">
        <TabsList className="h-auto w-fit justify-start gap-2 bg-transparent p-0">
          {goals.map((goal) => (
            <TabsTrigger
              key={goal.id}
              value={goal.id}
              className="rounded-xl border border-[#E3DEEF] bg-white px-4 py-2 text-sm font-semibold text-[#5D597A] shadow-[0_4px_10px_rgba(38,30,74,0.05)] transition-[background-color,border-color,color,box-shadow] hover:border-[#CFC5E6] hover:bg-[#F8F6FC] data-[state=active]:border-[#433A6A] data-[state=active]:bg-[#433A6A] data-[state=active]:text-white data-[state=active]:shadow-[0_10px_20px_rgba(67,58,106,0.24)]"
            >
              {goal.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid items-stretch gap-3 lg:grid-cols-3">
        <PriceCard plan={startPlan} />
        <div className="lg:-translate-y-3">
          <PriceCard plan={focusPlan} large />
        </div>
        <PriceCard plan={proPlan} />
      </div>
    </section>
  );
}
