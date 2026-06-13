import { ChartNoAxesColumn, Check, Gift, GraduationCap, UserRound } from "lucide-react";

import { CookieConsentBanner } from "@/features/marketing/components/cookie-consent-banner";
import { LeadForm } from "@/features/marketing/components/lead-form";

const benefits = [
  {
    icon: UserRound,
    text: "Познакомитесь с преподавателем"
  },
  {
    icon: ChartNoAxesColumn,
    text: "Пройдёте короткое тестирование уровня"
  },
  {
    icon: GraduationCap,
    text: "Получите рекомендации по обучению"
  },
  {
    icon: Gift,
    text: "Узнаете, какой формат занятий подойдёт именно вам"
  }
];

export function TrialLessonPage() {
  return (
    <main id="main-content" className="overflow-x-hidden text-[#322F55]">
      <section className="relative isolate overflow-hidden">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#8D70FF]/20 blur-3xl" aria-hidden="true" />

        <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(430px,0.82fr)] lg:items-start lg:gap-12 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#9D94CC]/60 bg-white/10 px-4 py-2 text-sm font-semibold text-[#F2EEFF] backdrop-blur-sm">
              <Check className="h-4 w-4 text-[#F9A29B]" aria-hidden="true" />
              Бесплатно
            </div>

            <h1 className="mt-6 max-w-[13ch] text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Запишитесь на бесплатный вводный урок
            </h1>
            <p className="mt-5 max-w-[55ch] text-lg leading-8 text-[#DED8F5]">
              Познакомимся, определим уровень и подберём подходящий формат обучения
            </p>

            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {benefits.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-[#F5F2FF]">
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#D9D0FF]">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="pt-1.5 text-sm font-medium leading-6">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0 rounded-[28px] border border-white/60 bg-white p-5 shadow-[0_24px_70px_rgba(22,16,44,0.3)] sm:p-7">
            <LeadForm
              framed={false}
              stackedFields
              source="trial_lesson_landing"
              formType="trial_lesson"
              title="Оставьте контакты"
              description="Мы свяжемся с вами, уточним цель и согласуем удобное время вводного урока."
              submitLabel="Записаться"
              successMessage="Спасибо! Мы получили вашу заявку и скоро свяжемся с вами."
              includeTrackingData
              submitTone="coral"
              additionalMetadata={{
                offer: "free_intro_lesson",
                placement: "lp_trial_lesson"
              }}
            />
          </div>
        </div>
      </section>

      <CookieConsentBanner />
    </main>
  );
}
