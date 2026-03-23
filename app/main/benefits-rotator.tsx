"use client";

import { CheckCircle2, Clock3, GraduationCap, MessageSquareText, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BenefitItem = {
  title: string;
  description: string;
  icon: LucideIcon;
  focusText: string;
};

const ROTATE_MS = 5000;

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
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [textVisible, setTextVisible] = useState(true);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncMotion = () => {
      setPrefersReducedMotion(motionQuery.matches);
    };

    syncMotion();
    motionQuery.addEventListener("change", syncMotion);
    return () => {
      motionQuery.removeEventListener("change", syncMotion);
    };
  }, []);

  const autoRotateEnabled = !prefersReducedMotion && !isPaused;

  useEffect(() => {
    if (!autoRotateEnabled) return;
    let swapTimer: number | null = null;
    const timer = setInterval(() => {
      setTextVisible(false);
      if (swapTimer) {
        window.clearTimeout(swapTimer);
      }
      swapTimer = window.setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % benefits.length);
        setTextVisible(true);
      }, 180);
    }, ROTATE_MS);
    return () => {
      clearInterval(timer);
      if (swapTimer) {
        window.clearTimeout(swapTimer);
      }
    };
  }, [autoRotateEnabled]);

  const activeBenefit = useMemo(() => benefits[activeIndex] ?? benefits[0], [activeIndex]);

  function handleBlur(event: React.FocusEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setIsPaused(false);
  }

  return (
    <section
      id="benefits"
      className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={handleBlur}
    >
      <div className="mb-8 space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-[#322F55]">Что вы получите в обучении</h2>
        <p className="text-[#706E88]">Сильная методика, понятная структура и практика, которая переносится в реальную речь.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
        <ul className="divide-y divide-[#E3DEEF] rounded-3xl border border-[#E3DEEF] bg-white/85 shadow-sm">
          {benefits.map((item, index) => {
            const Icon = item.icon;
            const isActive = index === activeIndex;
            return (
              <li
                key={item.title}
                className={cn(
                  "flex items-start gap-4 p-6 transition-colors duration-300",
                  isActive
                    ? "bg-[radial-gradient(circle_at_top_right,rgba(141,112,255,0.35)_0%,transparent_52%),radial-gradient(circle_at_bottom_left,rgba(247,109,99,0.18)_0%,transparent_44%),linear-gradient(135deg,#312B52_0%,#443D6D_48%,#575086_100%)]"
                    : "bg-transparent"
                )}
                aria-current={isActive ? "true" : undefined}
              >
                <div
                  className={cn(
                    "mt-0.5 rounded-xl p-2 transition-colors duration-300",
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
              </li>
            );
          })}
        </ul>

        <aside className="rounded-3xl bg-[linear-gradient(160deg,#322F55_0%,#4A4476_100%)] p-6 text-white shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#D9D0FF]">Фокус результата</p>
          <p
            className={cn(
              "mt-4 text-lg leading-relaxed transition-all duration-400 ease-out",
              prefersReducedMotion || textVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
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
