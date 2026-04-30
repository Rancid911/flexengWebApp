"use client";

import { CheckCircle2, Clock3, GraduationCap, MessageSquareText, type LucideIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

type BenefitItem = {
  title: string;
  description: string;
  icon: LucideIcon;
  focusText: string;
};

const benefits: BenefitItem[] = [
  {
    title: "Персональная программа",
    description: "Фокусируемся на вашей цели: работа, переезд, экзамены или свободное общение.",
    icon: MessageSquareText,
    focusText: "Персональный маршрут помогает убрать лишнее и держать фокус только на вашей цели."
  },
  {
    title: "Сильные преподаватели",
    description: "Подбираем преподавателя под ваш запрос и стиль обучения.",
    icon: GraduationCap,
    focusText: "Сильный преподаватель даёт точную обратную связь и ускоряет выход в уверенную речь."
  },
  {
    title: "Измеримый прогресс",
    description: "Регулярно проверяем результат и корректируем учебный маршрут.",
    icon: CheckCircle2,
    focusText: "Контрольные точки и понятные метрики делают прогресс прозрачным и управляемым."
  },
  {
    title: "Гибкий график",
    description: "Утро, день или вечер: расписание выстраивается под вашу реальность.",
    icon: Clock3,
    focusText: "Гибкий график позволяет не выпадать из темпа и сохранять стабильность обучения."
  }
];

export function BenefitsRotator() {
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const prefersReducedMotion = usePrefersReducedMotion();
  const activeBenefit = useMemo(() => benefits[activeIndex] ?? benefits[0], [activeIndex]);

  function focusTab(index: number) {
    const boundedIndex = (index + benefits.length) % benefits.length;
    setActiveIndex(boundedIndex);
    tabRefs.current[boundedIndex]?.focus();
  }

  return (
    <section id="benefits" className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-[#322F55]">Что вы получите в обучении</h2>
        <p className="text-[#706E88]">Сильная методика, понятная структура и практика, которая переносится в реальную речь.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
        <div
          role="tablist"
          aria-label="Преимущества обучения"
          aria-orientation="vertical"
          className="divide-y divide-[#E3DEEF] rounded-3xl border border-[#E3DEEF] bg-white/85 shadow-sm"
        >
          {benefits.map((item, index) => {
            const Icon = item.icon;
            const isActive = index === activeIndex;
            return (
              <button
                key={item.title}
                id={`benefit-tab-${index}`}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`benefit-panel-${index}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveIndex(index)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown" || event.key === "ArrowRight") {
                    event.preventDefault();
                    focusTab(index + 1);
                    return;
                  }

                  if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
                    event.preventDefault();
                    focusTab(index - 1);
                    return;
                  }

                  if (event.key === "Home") {
                    event.preventDefault();
                    focusTab(0);
                    return;
                  }

                  if (event.key === "End") {
                    event.preventDefault();
                    focusTab(benefits.length - 1);
                  }
                }}
                className={cn(
                  "flex w-full items-start gap-4 p-6 text-left transition-[background-color,color,box-shadow] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D70FF] focus-visible:ring-inset",
                  isActive
                    ? "bg-[radial-gradient(circle_at_top_right,rgba(141,112,255,0.35)_0%,transparent_52%),radial-gradient(circle_at_bottom_left,rgba(247,109,99,0.18)_0%,transparent_44%),linear-gradient(135deg,#312B52_0%,#443D6D_48%,#575086_100%)]"
                    : "bg-transparent focus-visible:bg-[#f7f3ff]"
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 rounded-xl p-2 transition-[background-color,color] duration-300",
                    isActive ? "bg-[rgba(255,255,255,0.16)] text-[#F2EEFF]" : "bg-[#EEE8FF] text-[#7D6BCC]"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className={cn("text-xl font-semibold transition-colors duration-300", isActive ? "text-white" : "text-[#4A4666]")}>{item.title}</h3>
                  <p className={cn("mt-1 text-sm leading-relaxed transition-colors duration-300", isActive ? "text-[#E5E0F8]" : "text-[#8A86A3]")}>
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <aside
          id={`benefit-panel-${activeIndex}`}
          role="tabpanel"
          aria-labelledby={`benefit-tab-${activeIndex}`}
          className="rounded-3xl bg-[linear-gradient(160deg,#322F55_0%,#4A4476_100%)] p-6 text-white shadow-sm"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-[#D9D0FF]">Фокус результата</p>
          <p
            className={cn(
              "mt-4 text-lg leading-relaxed transition-[opacity,transform] duration-400 ease-out",
              prefersReducedMotion ? "opacity-100" : "opacity-100 translate-y-0"
            )}
          >
            {activeBenefit.focusText}
          </p>
          <a href="#lead-form" className={cn(buttonVariants({ size: "lg" }), "mt-6 h-11 rounded-xl bg-[#F76D63] px-5 text-white hover:bg-[#E05B51]")}>
            Хочу такой формат
          </a>
        </aside>
      </div>
    </section>
  );
}
