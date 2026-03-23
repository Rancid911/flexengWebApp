import Link from "next/link";
import { MessageCircle, Play, Send, Users } from "lucide-react";

export function MainFooter({ leadHref = "#lead-form" }: { leadHref?: string }) {
  return (
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
            <a href={leadHref} className="block text-[#D6CFF2] transition-colors hover:text-white">
              Оставить заявку
            </a>
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
  );
}
