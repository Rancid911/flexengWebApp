"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  hasCookieConsent,
  writeCookieConsent
} from "@/lib/consent/cookie-consent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const initTimer = window.setTimeout(() => {
      setVisible(!hasCookieConsent());
    }, 0);

    return () => {
      window.clearTimeout(initTimer);
    };
  }, []);

  function acceptAll() {
    writeCookieConsent({
      analytics: true,
      marketing: true,
      functional: true
    });
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <section aria-label="Уведомление о cookies" className="fixed inset-x-0 bottom-0 z-[80] px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="mx-auto w-full max-w-5xl space-y-2">
        <div className="rounded-xl border border-[#6A6495] bg-[linear-gradient(160deg,#322F55_0%,#4A4476_100%)] px-3 py-2 shadow-[0_12px_32px_rgba(18,14,39,0.42)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] leading-relaxed text-[#EAE4FF] sm:text-xs">
              Мы используем cookies для стабильной работы сайта и улучшения сервиса.
            </p>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
              <Button type="button" className="h-8 rounded-lg bg-[#2FB4B7] px-3 text-xs font-semibold text-white hover:bg-[#249CA0]" onClick={acceptAll}>
                Согласен
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
