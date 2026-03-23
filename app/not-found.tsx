import Link from "next/link";
import { MessageCircle, Play, Send, Users } from "lucide-react";

import { MainHeader } from "./main/main-header";

const navItems = [
  { href: "/#programs", label: "Программы" },
  { href: "/#teachers", label: "Преподаватели" },
  { href: "/#pricing", label: "Стоимость" }
];

export default function NotFound() {
  return (
    <div className="bg-[radial-gradient(circle_at_20%_0%,#F2EEFF_0%,#FFFFFF_45%,#F8F5FF_100%)]">
      <div className="flex h-[95vh] flex-col">
        <MainHeader navItems={navItems} />
        <main className="relative min-h-0 flex-1 overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute -left-24 top-12 h-64 w-64 rounded-full bg-[#E9E1FF] blur-3xl" />
          <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-[#FFE7DB] blur-3xl" />

          <div className="mx-auto flex h-full w-full max-w-5xl flex-col">
            <div className="relative z-10 mx-auto flex w-full flex-1 flex-col items-center justify-center gap-6 py-6">
              <div className="w-full max-w-3xl">
                <svg viewBox="0 0 760 320" className="h-auto w-full" role="img" aria-label="Иллюстрация ошибки 404">
                <defs>
                  <linearGradient id="digitPurple" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6F5BDA" />
                    <stop offset="100%" stopColor="#4C3AA8" />
                  </linearGradient>
                  <linearGradient id="digitCoral" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FF8D5B" />
                    <stop offset="100%" stopColor="#E9602B" />
                  </linearGradient>
                  <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#271a57" floodOpacity="0.15" />
                  </filter>
                </defs>

                <ellipse cx="170" cy="268" rx="82" ry="16" fill="#ECE5FF" />
                <ellipse cx="380" cy="270" rx="92" ry="18" fill="#F2ECFF" />
                <ellipse cx="590" cy="268" rx="82" ry="16" fill="#FBE8DE" />

                <text x="120" y="220" fill="url(#digitPurple)" fontSize="175" fontWeight="800" fontFamily="system-ui" filter="url(#softShadow)">
                  4
                </text>
                <text x="316" y="224" fill="url(#digitCoral)" fontSize="185" fontWeight="800" fontFamily="system-ui" filter="url(#softShadow)">
                  0
                </text>
                <text x="545" y="220" fill="url(#digitPurple)" fontSize="175" fontWeight="800" fontFamily="system-ui" filter="url(#softShadow)">
                  4
                </text>

                <g>
                  <circle cx="246" cy="62" r="14" fill="#5D49C4" />
                  <rect x="236" y="76" width="20" height="38" rx="10" fill="#8E7CEF" />
                  <rect x="216" y="90" width="20" height="10" rx="5" transform="rotate(-22 216 90)" fill="#8E7CEF" />
                  <rect x="256" y="90" width="20" height="10" rx="5" transform="rotate(24 256 90)" fill="#8E7CEF" />
                </g>

                <g>
                  <circle cx="515" cy="70" r="14" fill="#F07448" />
                  <rect x="505" y="84" width="20" height="40" rx="10" fill="#FF9F75" />
                  <rect x="489" y="102" width="15" height="10" rx="5" transform="rotate(20 489 102)" fill="#FF9F75" />
                  <rect x="525" y="99" width="16" height="10" rx="5" transform="rotate(-25 525 99)" fill="#FF9F75" />
                </g>

                <g>
                  <rect x="80" y="112" width="44" height="32" rx="8" fill="#6C57D8" />
                  <line x1="88" y1="126" x2="116" y2="126" stroke="#ECE6FF" strokeWidth="3" />
                  <line x1="88" y1="133" x2="108" y2="133" stroke="#ECE6FF" strokeWidth="3" />
                </g>

                <g>
                  <circle cx="652" cy="122" r="20" fill="#FF8E62" />
                  <path d="M642 122h20M652 112v20" stroke="#FFF5EF" strokeWidth="3.5" strokeLinecap="round" />
                </g>

                <circle cx="303" cy="74" r="4" fill="#D7CBFF" />
                <circle cx="452" cy="50" r="5" fill="#FFD6C3" />
                <circle cx="570" cy="95" r="4" fill="#D7CBFF" />
                <circle cx="173" cy="77" r="5" fill="#FFD6C3" />
              </svg>

                <h1 className="mt-2 text-center text-2xl font-semibold tracking-tight text-[#2E1065] sm:text-3xl">
                  Упс… страница на доработке
                </h1>
                <p className="mt-3 text-center text-sm text-[#5B5772] sm:text-base">Пошла подтянуть English - скоро будет back</p>
              </div>
            </div>
          </div>
        </main>
      </div>

      <footer className="border-t border-[#5E558F] bg-[linear-gradient(160deg,#433A6A_0%,#4F467D_45%,#3D355F_100%)]">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2 text-sm">
              <p className="font-semibold uppercase tracking-wide text-[#F0EBFF]">Флексенг</p>
              <p className="text-[#D6CFF2]">Онлайн-школа английского языка с персональными программами и контролем прогресса.</p>
              <div className="space-y-1 text-[#D6CFF2]">
                <p className="font-medium text-[#E6E0FA]">courses@flexeng.ru</p>
                <p className="font-medium text-[#E6E0FA]">+7 (999) 555-12-34</p>
                <p className="text-xs text-[#BFB6DE]">Ежедневно 9:00-21:00 (МСК)</p>
              </div>
              <div className="flex items-center gap-2.5 pt-2">
                <a
                  href="#"
                  aria-label="Telegram"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#7E74AF] text-[#E8E2FF] transition-colors hover:bg-[#5A5188]"
                >
                  <Send className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  aria-label="WhatsApp"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#7E74AF] text-[#E8E2FF] transition-colors hover:bg-[#5A5188]"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  aria-label="VK"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#7E74AF] text-[#E8E2FF] transition-colors hover:bg-[#5A5188]"
                >
                  <Users className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  aria-label="YouTube"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#7E74AF] text-[#E8E2FF] transition-colors hover:bg-[#5A5188]"
                >
                  <Play className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <p className="font-semibold uppercase tracking-wide text-[#F0EBFF]">Школа</p>
              <a href="/about" className="block text-[#D6CFF2] transition-colors hover:text-white">
                О нас
              </a>
              <a href="/about" className="block text-[#D6CFF2] transition-colors hover:text-white">
                Наша методика
              </a>
              <a href="/about" className="block text-[#D6CFF2] transition-colors hover:text-white">
                Преподаватели
              </a>
              <a href="/about" className="block text-[#D6CFF2] transition-colors hover:text-white">
                Результаты учеников
              </a>
              <a href="/about" className="block text-[#D6CFF2] transition-colors hover:text-white">
                Контакты
              </a>
            </div>

            <div className="space-y-2 text-sm">
              <p className="font-semibold uppercase tracking-wide text-[#F0EBFF]">Обучение</p>
              <Link href="/#programs" className="block text-[#D6CFF2] transition-colors hover:text-white">
                Программы
              </Link>
              <Link href="/#pricing" className="block text-[#D6CFF2] transition-colors hover:text-white">
                Стоимость и тарифы
              </Link>
              <a href="/faq" className="block text-[#D6CFF2] transition-colors hover:text-white">
                Вопросы и ответы
              </a>
              <Link href="/#lead-form" className="block text-[#D6CFF2] transition-colors hover:text-white">
                Оставить заявку
              </Link>
            </div>

            <div className="space-y-2 text-sm">
              <p className="font-semibold uppercase tracking-wide text-[#F0EBFF]">Форматы и цели</p>
              <a href="/formats/individual" className="block text-[#D6CFF2] transition-colors hover:text-white">
                Индивидуально
              </a>
              <a href="/formats/group" className="block text-[#D6CFF2] transition-colors hover:text-white">
                Мини-группы
              </a>
              <a href="/formats/speaking-club" className="block text-[#D6CFF2] transition-colors hover:text-white">
                Разговорный клуб
              </a>
              <a href="/formats/intensive" className="block text-[#D6CFF2] transition-colors hover:text-white">
                Интенсив
              </a>
              <a href="/goals/work" className="block text-[#D6CFF2] transition-colors hover:text-white">
                Для работы
              </a>
              <a href="/goals/travel" className="block text-[#D6CFF2] transition-colors hover:text-white">
                Для путешествий
              </a>
              <a href="/goals/exams" className="block text-[#D6CFF2] transition-colors hover:text-white">
                Подготовка к экзаменам
              </a>
              <a href="/goals/interview" className="block text-[#D6CFF2] transition-colors hover:text-white">
                Для собеседований
              </a>
            </div>

            <div className="space-y-2 text-sm">
              <p className="font-semibold uppercase tracking-wide text-[#F0EBFF]">Условия и поддержка</p>
              <a href="/legal/payment-terms" className="block text-[#D6CFF2] transition-colors hover:text-white">
                Условия оплаты
              </a>
              <a href="/legal/payment-process" className="block text-[#D6CFF2] transition-colors hover:text-white">
                Как проходит оплата
              </a>
              <a href="/legal/refund-policy" className="block text-[#D6CFF2] transition-colors hover:text-white">
                Возврат и перенос
              </a>
              <Link href="/articles" className="block text-[#D6CFF2] transition-colors hover:text-white">
                Блог
              </Link>
              <a href="/support" className="block text-[#D6CFF2] transition-colors hover:text-white">
                Поддержка
              </a>
              <a href="/about" className="block text-[#D6CFF2] transition-colors hover:text-white">
                Контакты
              </a>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 border-t border-[#6E65A7] pt-5 text-xs text-[#BFB6DE] sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Флексенг. Все права защищены.</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <a href="/legal/public-offer" className="transition-colors hover:text-white">
                Публичная оферта
              </a>
              <a href="/legal/privacy-policy" className="transition-colors hover:text-white">
                Политика конфиденциальности
              </a>
              <a href="/legal/pd-consent" className="transition-colors hover:text-white">
                Согласие на обработку ПД
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
