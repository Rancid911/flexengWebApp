"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, BadgePercent, ChartNoAxesColumn, Gift, UserRound, X } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { LeadForm } from "./lead-form";

export function HeroLeadModal() {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openRafRef = useRef<number | null>(null);

  function openModal() {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    if (openRafRef.current) cancelAnimationFrame(openRafRef.current);
    setIsMounted(true);
    openRafRef.current = requestAnimationFrame(() => setIsVisible(true));
  }

  function closeModal() {
    setIsVisible(false);
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setIsMounted(false);
    }, 240);
  }

  useEffect(() => {
    if (!isMounted) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMounted]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      if (openRafRef.current) cancelAnimationFrame(openRafRef.current);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={cn(buttonVariants({ size: "lg" }), "h-12 rounded-xl bg-[#F76D63] px-7 text-white hover:bg-[#E05B51]")}
      >
        Оставить заявку
        <ArrowRight className="ml-2 h-4 w-4" />
      </button>

      {isMounted ? (
        <div className="fixed inset-0 z-50 grid place-items-center px-4 py-6">
          <button
            aria-label="Закрыть форму заявки"
            className={cn(
              "absolute inset-0 bg-[rgba(35,31,58,0.68)] backdrop-blur-sm transition-opacity duration-300 ease-out",
              isVisible ? "opacity-100" : "opacity-0"
            )}
            onClick={closeModal}
          />
          <div
            className={cn(
              "relative z-10 w-full max-w-3xl overflow-hidden rounded-[28px] border border-[#DCD6EB] bg-[linear-gradient(160deg,#F2ECFB_0%,#F7F4FC_55%,#F3EFF9_100%)] p-2 shadow-[0_24px_80px_rgba(51,41,85,0.28)] transition-[transform,opacity] duration-300 ease-out",
              isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-[0.98] opacity-0"
            )}
          >
            <div className="rounded-[22px] bg-[linear-gradient(160deg,#F7F3FF_0%,#FFFFFF_60%)] p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-wide text-[#706E88]">Заявка на обучение</p>
                <button
                  type="button"
                  aria-label="Закрыть окно"
                  onClick={closeModal}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#D6D5DD] bg-white text-[#706E88] transition-[color,background-color,border-color,box-shadow] hover:bg-[#F5F5F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D70FF] focus-visible:ring-offset-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-6 rounded-2xl bg-[linear-gradient(145deg,#F6F2FF_0%,#EEE8FA_55%,#E7E0F4_100%)] p-4 md:min-h-[540px] md:grid-cols-[0.92fr_1.08fr] md:items-stretch">
                <section className="h-full py-1">
                  <h2 className="text-3xl font-bold leading-tight text-[#322F55]">Запишитесь на бесплатный вводный урок</h2>
                  <ul className="mt-5 space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#D6D5DD] bg-[#F7F3FF] text-[#654ED6]">
                        <UserRound className="h-4 w-4" />
                      </span>
                      <span className="text-sm text-[#5E5A7A]">Познакомьтесь с преподавателем и форматом обучения.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#D6D5DD] bg-[#F7F3FF] text-[#654ED6]">
                        <ChartNoAxesColumn className="h-4 w-4" />
                      </span>
                      <span className="text-sm text-[#5E5A7A]">Пройдите комплексное тестирование уровня английского.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#D6D5DD] bg-[#F7F3FF] text-[#654ED6]">
                        <Gift className="h-4 w-4" />
                      </span>
                      <span className="text-sm text-[#5E5A7A]">Получите полезный старт-пак для самостоятельной практики.</span>
                    </li>
                  </ul>
                  <div className="mt-6 flex min-h-[74px] items-center rounded-2xl bg-[linear-gradient(145deg,#2D284A_0%,#3B345F_100%)] px-5 py-4 shadow-[0_12px_30px_rgba(37,29,66,0.35)]">
                    <p className="flex items-center gap-2.5 text-base font-semibold leading-snug text-[#F5F2FF]">
                      <BadgePercent className="h-5 w-5 shrink-0 text-[#D9D0FF]" />
                      Сэкономьте до 20% при старте в первую неделю после диагностики
                    </p>
                  </div>
                </section>
                <div className="h-full py-1">
                  <LeadForm variant="light" framed={false} stackedFields showAgreementText={false} />
                </div>
                <p className="pt-1 text-xs text-[#706E88] md:col-span-2">
                  Нажимая кнопку отправки, вы принимаете пользовательское соглашение и подтверждаете достоверность указанных данных.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
