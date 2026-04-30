"use client";

import { CircleAlert, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { usePaymentReminderPanel } from "@/app/(workspace)/(shared-zone)/dashboard/use-payment-reminder-panel";
import { Button } from "@/components/ui/button";
import type { StudentPaymentReminderPopup } from "@/lib/billing/types";
import { formatBillingMoneyAmount, formatLessonCount } from "@/lib/billing/utils";
import { formatRuLongDateTime } from "@/lib/dates/format-ru-date";

export function StudentPaymentReminderPanel({ popup }: { popup: StudentPaymentReminderPopup }) {
  const router = useRouter();
  const { panelVisible, panelMounted, panelClosing, closePanel } = usePaymentReminderPanel(true);

  const paymentPopupLessonLabel = useMemo(() => {
    if (!popup.nextScheduledLessonAt) return null;
    return formatRuLongDateTime(popup.nextScheduledLessonAt) || null;
  }, [popup.nextScheduledLessonAt]);

  const reminderTheme = useMemo(
    () =>
      popup.status === "debt"
        ? {
            panelClass:
              "border-white/20 bg-[linear-gradient(135deg,#5d38e8_0%,#7c3aed_44%,#9d4edd_100%)] text-white shadow-[0_30px_64px_rgba(78,42,181,0.38)] ring-1 ring-white/12",
            railClass: "from-white/45 via-white/20 to-white/45",
            iconClass: "bg-white/14 text-white ring-1 ring-white/18",
            chipClass: "bg-white/14 text-white ring-1 ring-white/20",
            summaryLabel: "Напоминание",
            title: "Есть задолженность",
            summary: `Задолженность: ${formatLessonCount(popup.debtLessonCount)}${
              popup.debtMoneyAmount > 0 ? ` · ${formatBillingMoneyAmount(popup.debtMoneyAmount)}` : ""
            }`,
            summaryPanelClass: "bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.08)_100%)] ring-white/14",
            summaryTextClass: "text-white",
            lessonTextClass: "text-white/78",
            closeButtonClass:
              "text-white/72 hover:bg-white/12 hover:text-white focus-visible:ring-white/28",
            ctaClass:
              "bg-white text-[#6f4cf6] shadow-[0_16px_32px_rgba(31,10,90,0.24)] hover:bg-[#f6f1ff]"
          }
        : {
            panelClass:
              "border-white/18 bg-[linear-gradient(135deg,#6f4cf6_0%,#8b5cf6_48%,#a56bff_100%)] text-white shadow-[0_28px_58px_rgba(92,62,205,0.34)] ring-1 ring-white/12",
            railClass: "from-white/42 via-white/18 to-white/42",
            iconClass: "bg-white/14 text-white ring-1 ring-white/18",
            chipClass: "bg-white/14 text-white ring-1 ring-white/20",
            summaryLabel: "Напоминание",
            title: popup.availableLessonCount === 1 ? "Остался 1 урок" : "Уроки заканчиваются",
            summary: `Доступно уроков: ${formatLessonCount(popup.availableLessonCount)}`,
            summaryPanelClass: "bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.08)_100%)] ring-white/14",
            summaryTextClass: "text-white",
            lessonTextClass: "text-white/78",
            closeButtonClass:
              "text-white/72 hover:bg-white/12 hover:text-white focus-visible:ring-white/28",
            ctaClass:
              "bg-white text-[#6f4cf6] shadow-[0_16px_32px_rgba(31,10,90,0.22)] hover:bg-[#f6f1ff]"
          },
    [popup]
  );

  if (!panelMounted) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 w-[calc(100vw-2rem)] max-w-sm sm:bottom-6 sm:right-6">
      <div
        className={`pointer-events-auto relative overflow-hidden rounded-[1.85rem] border px-4 pb-4 pt-5 transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          panelVisible && !panelClosing ? "translate-y-0 opacity-100" : "translate-y-[115%] opacity-0"
        } ${reminderTheme.panelClass}`}
      >
        <div className={`absolute inset-x-4 top-0 h-1.5 rounded-b-full bg-gradient-to-r ${reminderTheme.railClass}`} />
        <div aria-hidden className="pointer-events-none absolute right-[-56px] top-[-58px] h-40 w-40 rounded-full bg-white/14 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute bottom-[-52px] left-[-34px] h-28 w-28 rounded-full bg-white/10 blur-2xl" />
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.15rem] ${reminderTheme.iconClass}`}>
            <CircleAlert className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${reminderTheme.chipClass}`}>
                  {reminderTheme.summaryLabel}
                </span>
                <h2 className="mt-2 text-[1.08rem] font-black tracking-[-0.045em] text-white">{reminderTheme.title}</h2>
              </div>
              <button
                type="button"
                onClick={closePanel}
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-[color,background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${reminderTheme.closeButtonClass}`}
                aria-label="Закрыть напоминание"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className={`mt-3 rounded-[1.2rem] px-3 py-3 ring-1 backdrop-blur-sm ${reminderTheme.summaryPanelClass}`}>
              <p className={`text-sm font-black ${reminderTheme.summaryTextClass}`}>{reminderTheme.summary}</p>
              {paymentPopupLessonLabel ? <p className={`mt-1 text-xs font-semibold ${reminderTheme.lessonTextClass}`}>Ближайший урок: {paymentPopupLessonLabel}</p> : null}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button
                type="button"
                className={`h-10 rounded-[1rem] px-4 text-sm font-black ${reminderTheme.ctaClass}`}
                onClick={() => router.push("/settings/payments")}
              >
                К оплате
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
