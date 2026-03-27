import Link from "next/link";
import { MessageCircle, Play, Send, Users } from "lucide-react";

import {
  formatFooterLinks,
  learningFooterLinks,
  legalFooterLinks,
  schoolFooterLinks,
  supportFooterLinks
} from "./site-navigation";

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
            {schoolFooterLinks.map((item) => (
              <Link key={item.label} href={item.href} className="block text-[#D6CFF2] transition-colors hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold uppercase tracking-wide text-[#F0EBFF]">Обучение</p>
            {learningFooterLinks.map((item) => (
              <Link
                key={item.label}
                href={item.label === "Оставить заявку" ? leadHref : item.href}
                className="block text-[#D6CFF2] transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold uppercase tracking-wide text-[#F0EBFF]">Форматы и цели</p>
            {formatFooterLinks.map((item) => (
              <Link key={item.label} href={item.href} className="block text-[#D6CFF2] transition-colors hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold uppercase tracking-wide text-[#F0EBFF]">Условия и поддержка</p>
            {supportFooterLinks.map((item) => (
              <Link key={item.label} href={item.href} className="block text-[#D6CFF2] transition-colors hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-[#6E65A7] pt-5 text-xs text-[#BFB6DE] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Флексенг. Все права защищены.</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            {legalFooterLinks.map((item) => (
              <Link key={item.label} href={item.href} className="transition-colors hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
