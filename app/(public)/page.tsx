import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { CookieConsentBanner } from "@/app/main/cookie-consent-banner";
import { BenefitsRotator } from "@/app/main/benefits-rotator";
import { HeroLeadModal } from "@/app/main/hero-lead-modal";
import { LeadForm } from "@/app/main/lead-form";
import { PricingSection } from "@/app/main/pricing-section";
import { ReviewsSlider } from "@/app/main/reviews-slider";

export const metadata: Metadata = {
  title: "Школа английского языка онлайн - изучение английского языка в удобной учебной среде",
  description: "Флексенг помогает уверенно говорить на английском через персональные программы, сильных преподавателей и понятный трек прогресса.",
  openGraph: {
    title: "Школа английского языка онлайн - изучение английского языка в удобной учебной среде",
    description: "Онлайн-школа с персональной программой, сильными преподавателями и измеримым прогрессом.",
    type: "website",
    locale: "ru_RU"
  }
};

const highlights = [
  { value: "92%", label: "студентов сохраняют регулярный темп обучения" },
  { value: "1:1", label: "индивидуальные уроки с преподавателем" },
  { value: "A1–C1", label: "программы для всех уровней" }
];

const steps = [
  {
    title: "Определяем стартовую точку",
    description: "Проводим короткую диагностику уровня и фиксируем учебную цель."
  },
  {
    title: "Собираем план обучения",
    description: "Формируем персональный маршрут с конкретными темами и практикой."
  },
  {
    title: "Ведём к результату",
    description: "На уроках и самостоятельной практике закрепляем навык общения на английском."
  }
];

const programs = [
  {
    title: "Общий английский",
    subtitle: "Для повседневного общения",
    description: "Разговорная практика, грамматика и словарь в сбалансированном формате.",
    level: "A1–B2"
  },
  {
    title: "Английский для карьеры",
    subtitle: "Работа и международная коммуникация",
    description: "Фокус на деловую лексику, переговоры, собеседования и переписку.",
    level: "B1–C1"
  },
  {
    title: "Интенсив разговорной практики",
    subtitle: "Ускоренный выход в речь",
    description: "Снимаем языковой барьер через регулярные speaking-сессии.",
    level: "A2–C1"
  }
];

const proofPoints = [
  "Персональный подбор преподавателя под цель и темп ученика",
  "Структурированные уроки и прозрачный трек прогресса",
  "Постоянная обратная связь по слабым зонам и точкам роста"
];

const flexlangAdvantages = [
  {
    title: "Маршрут под вашу цель",
    description: "Подбираем содержание уроков под ваши задачи: карьера, переезд, экзамены или свободное общение."
  },
  {
    title: "Регулярный контроль прогресса",
    description: "Фиксируем динамику по ключевым навыкам и своевременно корректируем учебный план."
  },
  {
    title: "Практика, которая закрепляется",
    description: "Совмещаем уроки, разговорные задачи и самостоятельную работу, чтобы результат переносился в реальную жизнь."
  },
  {
    title: "Поддержка на каждом этапе",
    description: "Помогаем сохранять темп, подстраивать расписание и не терять мотивацию в длинном цикле обучения."
  }
];

const afterLeadSteps = [
  "Связываемся с вами и уточняем учебную цель",
  "Проводим диагностику уровня английского",
  "Подбираем преподавателя и стартовый план"
];

const testimonials = [
  {
    name: "Мария, Product Manager",
    quote:
      "Через три месяца я уверенно провожу статусы с международной командой и меньше боюсь ошибаться. Стало проще формулировать мысли без долгих пауз."
  },
  {
    name: "Андрей, QA Engineer",
    quote:
      "Программа оказалась очень практичной: меньше теории ради теории, больше живых ситуаций. Заметил, что в рабочих чатах и созвонах стал отвечать гораздо быстрее."
  },
  {
    name: "Екатерина, маркетолог",
    quote:
      "Понравилось, что преподаватель адаптировал темы под мои рабочие задачи, а не по шаблону. Каждое занятие ощущается полезным именно для моей сферы."
  },
  {
    name: "Ирина, HR Business Partner",
    quote:
      "Стало проще проводить интервью на английском и уверенно общаться с кандидатами из разных стран. Особенно помогла регулярная speaking-практика с обратной связью."
  },
  {
    name: "Дмитрий, Project Manager",
    quote:
      "За два месяца заметно прокачал разговорный английский для ежедневных созвонов с зарубежной командой. Сейчас легче держать темп обсуждения и уточнять детали."
  },
  {
    name: "Ольга, предприниматель",
    quote:
      "Наконец-то начала говорить без долгих пауз. Уроки сразу применяются в общении с партнерами, и это сильно повышает уверенность в переговорах."
  },
  {
    name: "Никита, аналитик",
    quote:
      "Понравилась структура: чёткие цели на неделю и прозрачный прогресс по каждому навыку. Появилось ощущение системности и понятного движения к результату."
  },
  {
    name: "Светлана, дизайнер",
    quote:
      "Преподаватель помог подтянуть лексику для работы, и я стала свободнее презентовать идеи на английском. Теперь проще обсуждать концепции с иностранными коллегами."
  }
];

const faqs = [
  {
    question: "Можно ли начать с нуля?",
    answer: "Да. Мы начинаем с диагностики и формируем программу под ваш уровень и цель."
  },
  {
    question: "Сколько длится урок?",
    answer: "Стандартная длительность занятия — 50 минут. В интенсивных треках возможны другие форматы."
  },
  {
    question: "Можно ли менять расписание?",
    answer: "Да, график гибкий. Вы можете согласовывать удобное время с преподавателем."
  },
  {
    question: "Как отслеживается прогресс?",
    answer: "Мы фиксируем динамику по навыкам, мини-тестам и практическим заданиям в процессе обучения."
  },
  {
    question: "Подходит ли формат для занятых специалистов?",
    answer: "Да. Программа строится так, чтобы давать стабильный прогресс даже при плотном графике."
  }
];

export default function MainPage() {
  return (
    <main className="text-[#322F55]">
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#2D284A_0%,#3E3762_46%,#4A4476_100%)]">
        <div className="hero-blob hero-blob-a" />
        <div className="hero-blob hero-blob-b" />
        <div className="hero-blob hero-blob-c" />
        <div className="hero-blob hero-blob-d" />
        <div className="relative mx-auto grid w-full max-w-6xl gap-8 px-4 pb-20 pt-10 sm:px-6 sm:pb-24 sm:pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8 lg:py-32">
          <div className="space-y-6">
            <Badge className="border border-[#7D75B3] bg-[#4B4574]/80 text-[#E8E3FF]">Онлайн-школа английского языка</Badge>
            <div className="content-measure space-y-4">
              <h1 className="content-heading-balance max-w-[13ch] text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Английский, который работает в жизни и карьере
              </h1>
              <p className="max-w-[60ch] text-lg text-[#D9D4F2]">
                В «Флексенг» вы учитесь по персональному маршруту: от первой диагностики до уверенной практики в реальных задачах.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <HeroLeadModal />
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 rounded-xl border-[#857CB8] bg-[#4A4476]/45 px-7 text-[#E8E3FF] hover:bg-[#5A5389]"
                )}
              >
                Войти в кабинет
              </Link>
            </div>
            <p className="text-sm text-[#D0CAE9]">Без спама. Только консультация и персональный план обучения.</p>
          </div>
          <div className="rounded-3xl border border-[#6F679F] bg-[#403A67]/72 p-6 shadow-[0_20px_48px_rgba(25,18,46,0.35)] backdrop-blur-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#D9D4F2]">Почему выбирают Флексенг</p>
            <ul className="mt-5 space-y-4">
              {highlights.map((item) => (
                <li key={item.label} className="border-l-4 border-[#B9A8FF] pl-4">
                  <p className="text-2xl font-bold text-white">{item.value}</p>
                  <p className="text-sm text-[#D7D1F0]">{item.label}</p>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-full bg-[#5D568A]">
              <div className="h-2 w-[92%] rounded-full bg-gradient-to-r from-[#8D70FF] to-[#F76D63]" />
            </div>
          </div>
        </div>
      </section>

      <BenefitsRotator />

      <section id="how-it-works" className="relative">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-8 space-y-2">
          <h2 className="content-heading-balance max-w-[16ch] text-3xl font-bold tracking-tight text-[#322F55]">Как проходит обучение</h2>
          <p className="content-measure text-[#706E88]">Прозрачный маршрут от первой встречи до устойчивого результата.</p>
          </div>
          <ol className="space-y-6 md:grid md:grid-cols-3 md:gap-4 md:space-y-0">
            {steps.map((step, index) => (
              <li key={step.title} className="relative rounded-3xl border border-[#E3DEEF] bg-white/80 p-6">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#8D70FF] text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-xl font-semibold text-[#322F55]">{step.title}</h3>
                <p className="mt-2 text-sm text-[#706E88]">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="programs" className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-2">
          <h2 className="content-heading-balance max-w-[16ch] text-3xl font-bold tracking-tight text-[#322F55]">Программы под разные цели</h2>
          <p className="content-measure text-[#706E88]">Выберите направление и уровень, который нужен именно вам.</p>
        </div>

        <div className="hidden overflow-hidden rounded-3xl border border-[#E3DEEF] bg-white/85 shadow-sm md:block">
          <div className="grid grid-cols-[1.2fr_1fr_0.8fr] bg-[#F2EFF8] px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[#706E88]">
            <span>Программа</span>
            <span>Описание</span>
            <span>Уровень</span>
          </div>
          {programs.map((program) => (
            <div key={program.title} className="grid grid-cols-[1.2fr_1fr_0.8fr] items-start border-t border-[#E3DEEF] px-6 py-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[#654ED6]">{program.subtitle}</p>
                <h3 className="mt-1 text-lg font-semibold text-[#322F55]">{program.title}</h3>
              </div>
              <p className="pr-4 text-sm text-[#706E88]">{program.description}</p>
              <div className="flex justify-start md:justify-center">
                <span className="rounded-full bg-[#322F55] px-3 py-1 text-sm font-semibold text-white">{program.level}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 md:hidden">
          {programs.map((program) => {
            return (
              <article key={program.title} className="rounded-2xl border border-[#E3DEEF] bg-white/85 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#654ED6]">{program.subtitle}</p>
                <h3 className="mt-1 text-base font-semibold text-[#322F55]">{program.title}</h3>
                <p className="mt-1 text-sm text-[#706E88]">{program.description}</p>
                <p className="mt-2 text-sm font-semibold text-[#322F55]">{program.level}</p>
              </article>
            );
          })}
        </div>
      </section>

      <PricingSection />

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-2">
          <h2 className="content-heading-balance max-w-[18ch] text-3xl font-bold tracking-tight text-[#322F55]">Почему такой формат даёт результат</h2>
          <p className="content-measure text-[#706E88]">Мы выстроили обучение так, чтобы вы стабильно двигались к цели и видели прогресс по шагам.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {flexlangAdvantages.map((item) => (
            <article key={item.title} className="rounded-3xl border border-[#E3DEEF] bg-white/85 p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-[#322F55]">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#706E88]">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="teachers" className="relative">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
          <div className="space-y-3 rounded-3xl bg-[linear-gradient(145deg,#EEE8FF_0%,#F4F1FA_100%)] p-6">
            <h2 className="content-heading-balance max-w-[14ch] text-3xl font-bold tracking-tight text-[#322F55]">Преподаватели и контроль качества</h2>
            <p className="content-measure text-[#706E88]">
              Мы строим обучение так, чтобы у каждого ученика был понятный учебный путь и поддержка преподавателя на каждом этапе.
            </p>
          </div>
          <div className="rounded-3xl border border-[#E3DEEF] bg-white/85 p-6 shadow-sm">
            <div className="space-y-3">
              {proofPoints.map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#654ED6]" />
                  <p className="text-sm text-[#322F55]">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="reviews" className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-[#5E558F] bg-[linear-gradient(160deg,#433A6A_0%,#4F467D_45%,#3D355F_100%)] px-6 py-8 shadow-[0_20px_48px_rgba(34,24,63,0.28)] sm:px-8 sm:py-10">
          <div className="mb-8 space-y-2">
            <h2 className="content-heading-balance max-w-[12ch] text-3xl font-bold tracking-tight text-[#F6F2FF]">Отзывы учеников</h2>
            <p className="content-measure text-[#D6CFF2]">Реальные результаты, которые достигаются через системную практику.</p>
          </div>
          <ReviewsSlider items={testimonials} />
        </div>
      </section>

      <section id="faq" className="relative">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-8 space-y-2">
            <h2 className="content-heading-balance max-w-[14ch] text-3xl font-bold tracking-tight text-[#322F55]">Часто задаваемые вопросы</h2>
            <p className="content-measure text-[#706E88]">Короткие ответы на основные вопросы перед стартом.</p>
          </div>
          <div className="grid gap-3">
            {faqs.map((item) => (
              <details key={item.question} className="rounded-2xl border border-[#E3DEEF] bg-white/75 p-4">
                <summary className="cursor-pointer list-none pr-6 text-base font-semibold text-[#322F55]">{item.question}</summary>
                <p className="pt-3 text-sm text-[#706E88]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Переход к заявке" className="relative">
        <div className="mx-auto w-full max-w-6xl px-4 pb-2 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-[#6B629A] bg-[radial-gradient(circle_at_top_right,rgba(141,112,255,0.35)_0%,transparent_50%),radial-gradient(circle_at_bottom_left,rgba(247,109,99,0.16)_0%,transparent_42%),linear-gradient(135deg,#2F294D_0%,#3E3762_48%,#4E477A_100%)] px-5 py-5 shadow-[0_14px_36px_rgba(37,27,67,0.26)] sm:px-6 sm:py-6">
            <p className="text-lg font-semibold text-[#F5F2FF] sm:text-xl">Остались вопросы перед стартом?</p>
            <p className="content-measure mt-2 text-sm leading-relaxed text-[#DAD3F3]">
              Поможем выбрать комфортный формат, подберём программу под вашу цель и расскажем, как быстро начать обучение без перегруза.
            </p>
            <p className="mt-2 text-sm font-medium text-[#F1EBFF]">Ниже можно оставить заявку, и мы свяжемся с вами в ближайшее время.</p>
          </div>
        </div>
      </section>

      <section id="lead-form" className="relative">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <LeadForm />
          <div className="space-y-4">
            <div className="rounded-3xl border border-[#E3DEEF] bg-white/80 p-6">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#706E88]">После заявки</p>
              <ol className="space-y-3">
                {afterLeadSteps.map((step, index) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8D70FF] text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="text-sm text-[#322F55]">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-3xl bg-[linear-gradient(160deg,#322F55_0%,#4A4476_100%)] p-6 text-white">
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#D9D0FF]" />
                <p className="font-semibold">Гарантия комфортного старта</p>
              </div>
              <p className="text-sm text-[#F3EEFF]">
                Если после первых занятий понимаете, что нужен другой преподаватель или темп, мы оперативно корректируем план.
              </p>
            </div>
          </div>
        </div>
      </section>
      <div className="fixed inset-x-3 bottom-3 z-30 md:hidden">
        <a
          href="#lead-form"
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-12 w-full rounded-xl bg-[#8D70FF] text-white shadow-[0_10px_24px_rgba(101,78,214,0.35)] hover:bg-[#654ED6]"
          )}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Оставить заявку
        </a>
      </div>
      <CookieConsentBanner />
    </main>
  );
}
