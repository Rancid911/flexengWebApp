"use client";

import Link from "next/link";
import { BellRing, CreditCard, TriangleAlert } from "lucide-react";

import { useAdminPaymentsControlState } from "@/app/(workspace)/(staff-zone)/admin/payments/use-admin-payments-control-state";
import { adminPrimaryButtonClassName } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-button-tokens";
import { AdminSectionHero } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-section-hero";
import { AdminPaginationControls } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-pagination-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusMessage } from "@/components/ui/status-message";
import type {
  AdminPaymentControlDto,
  AdminPaymentControlFilter,
  AdminPaymentControlResponse,
  AdminPaymentReminderSettingsDto
} from "@/lib/admin/types";
import { formatBillingMoneyAmount } from "@/lib/billing/utils";
import { cn } from "@/lib/utils";

const FILTERS: Array<{ id: AdminPaymentControlFilter; label: string }> = [
  { id: "all", label: "Все" },
  { id: "attention", label: "Требуют внимания" },
  { id: "debt", label: "С долгом" },
  { id: "one_lesson", label: "1 урок и меньше" },
  { id: "unconfigured", label: "Не настроено" }
];

function toneClass(item: AdminPaymentControlDto) {
  if (item.billing_is_negative) return "border-[#e7d7d9] bg-[#fcf7f7]";
  if (item.billing_not_configured) return "border-slate-300 bg-slate-50";
  if (item.available_lesson_count <= 1) return "border-[#eadfc8] bg-[#fffaf0]";
  return "border-[#dfe5ef] bg-white";
}

function statusLabel(item: AdminPaymentControlDto) {
  if (item.billing_is_negative) return "Есть долг";
  if (item.billing_not_configured) return "Не настроено";
  if (item.available_lesson_count <= 1) return "Нужно пополнение";
  return "Норма";
}

function formatLessonPrice(item: AdminPaymentControlDto) {
  const value = item.effective_lesson_price_amount ?? item.lesson_price_amount;
  if (value == null || value <= 0) return null;
  return formatBillingMoneyAmount(value, item.billing_currency);
}

export function AdminPaymentsControlClient({
  initialData,
  initialSettings
}: {
  initialData: AdminPaymentControlResponse;
  initialSettings: AdminPaymentReminderSettingsDto;
}) {
  const {
    data,
    query,
    filter,
    page,
    loading,
    error,
    settings,
    settingsSaving,
    sendingReminderId,
    successMessage,
    currentPageCount,
    setQuery,
    setFilter,
    setPage,
    setSettings,
    saveSettings,
    sendReminder
  } = useAdminPaymentsControlState({ initialData, initialSettings });

  return (
    <div className="space-y-5 pb-8">
      <AdminSectionHero
        badgeIcon={CreditCard}
        badgeLabel="Оплата"
        title="Контроль оплаты и остатков"
        description="Отслеживайте долги, остатки уроков и напоминания по оплате в едином рабочем разделе."
        actionsSlot={
          <Link
            href="/admin"
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 text-sm font-black text-white transition hover:bg-white/15"
          >
            Открыть управление
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Всего студентов" value={String(data.stats.total_students)} tone="neutral" />
        <SummaryCard label="Требуют внимания" value={String(data.stats.attention_students)} tone="warning" />
        <SummaryCard label="С долгом" value={String(data.stats.debt_students)} tone="danger" />
        <SummaryCard label="Не настроено" value={String(data.stats.unconfigured_students)} tone="muted" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.5fr_0.9fr]">
        <Card className="rounded-[2rem] border-[#dfe9fb] bg-white shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-xl font-black tracking-[-0.04em] text-slate-900">Ученики и оплата</h2>
                <p className="text-sm text-slate-600">Список отсортирован от меньшего остатка уроков к большему, чтобы быстро увидеть учеников в зоне внимания.</p>
              </div>
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Поиск по имени, email или телефону"
                className="w-full max-w-md"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setFilter(item.id);
                    setPage(1);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] transition",
                    filter === item.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {error ? <StatusMessage>{error}</StatusMessage> : null}
            {successMessage ? <StatusMessage tone="success">{successMessage}</StatusMessage> : null}

            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={`payment-control-skeleton-${index}`} className="h-28 animate-pulse rounded-[1.4rem] border border-[#e6ebf2] bg-slate-50" />
                ))
              ) : data.items.length === 0 ? (
                <div className="rounded-[1.4rem] border border-dashed border-[#dfe5ef] bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  Подходящих студентов пока нет.
                </div>
              ) : (
                data.items.map((item) => (
                  <div key={item.student_id} className={cn("rounded-[1.4rem] border px-4 py-4", toneClass(item))}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-black tracking-tight text-slate-900">
                            {[item.first_name, item.last_name].filter(Boolean).join(" ").trim() || item.email || "Студент"}
                          </p>
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]",
                              item.billing_is_negative
                                ? "bg-rose-100 text-rose-700"
                                : item.billing_not_configured
                                  ? "bg-slate-200 text-slate-600"
                                  : item.available_lesson_count <= 1
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-emerald-100 text-emerald-700"
                            )}
                          >
                            {statusLabel(item)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">{item.email ?? "Email не указан"}{item.phone ? ` · ${item.phone}` : ""}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                            <span>Доступно уроков: <span className="font-black text-slate-900">{item.balance_label ?? "—"}</span></span>
                            <span>Режим: <span className="font-semibold text-slate-900">{item.billing_mode === "package_lessons" ? "Пакет уроков" : item.billing_mode === "per_lesson_price" ? "По цене урока" : "Не настроено"}</span></span>
                            {formatLessonPrice(item) ? <span>Цена урока: <span className="font-semibold text-slate-900">{formatLessonPrice(item)}</span></span> : null}
                            {item.money_remainder_amount > 0 ? <span>Хвост: <span className="font-semibold text-slate-900">{formatBillingMoneyAmount(item.money_remainder_amount, item.billing_currency)}</span></span> : null}
                        </div>
                        {item.debt_label ? <p className="text-sm font-semibold text-slate-700">Задолженность: {item.debt_label}</p> : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link href={`/admin/students/${item.student_id}`} className={`inline-flex h-10 items-center px-4 text-sm transition ${adminPrimaryButtonClassName}`}>
                          Оплата и списания
                        </Link>
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-10 rounded-2xl"
                          disabled={sendingReminderId === item.student_id}
                          onClick={() => void sendReminder(item.student_id)}
                        >
                          <BellRing className="mr-2 h-4 w-4" />
                          {sendingReminderId === item.student_id ? "Отправка..." : "Отправить напоминание"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <AdminPaginationControls
              page={page}
              pageCount={currentPageCount}
              onFirst={() => setPage(1)}
              onPrev={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() => setPage((current) => Math.min(currentPageCount, current + 1))}
              onLast={() => setPage(currentPageCount)}
            />
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-[#dfe9fb] bg-white shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
          <CardContent className="space-y-5 p-6">
            <div>
              <h2 className="text-xl font-black tracking-[-0.04em] text-slate-900">Напоминания об оплате</h2>
              <p className="mt-1 text-sm text-slate-600">
                Настройте порог, при котором ученики попадают в зону риска, и отправляйте адресные уведомления из списка.
              </p>
            </div>

            <div className="rounded-[1.4rem] border border-[#dfe5ef] bg-slate-50 px-4 py-4">
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 h-5 w-5 text-amber-600" />
                  <div className="text-sm text-slate-600">
                  После сохранения порога система сразу пересчитывает учеников в зоне внимания. Из списка ниже можно дополнительно отправить адресное напоминание вручную.
                </div>
              </div>
            </div>

            <FormField className="space-y-2" label="Статус напоминаний" labelClassName="text-sm font-semibold text-slate-700">
              <Select
                className="h-11 rounded-2xl border-[#dbe5f4] px-3"
                value={settings.enabled ? "enabled" : "disabled"}
                onChange={(event) => setSettings((current) => ({ ...current, enabled: event.target.value === "enabled" }))}
              >
                <option value="enabled">Включены</option>
                <option value="disabled">Выключены</option>
              </Select>
            </FormField>

            <FormField
              className="space-y-2"
              label="Порог по урокам"
              labelClassName="text-sm font-semibold text-slate-700"
              hint="При таком остатке ученик попадает в зону внимания. По умолчанию используется порог в 1 урок."
            >
              <Input
                value={String(settings.threshold_lessons)}
                inputMode="numeric"
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    threshold_lessons: Math.max(0, Number(event.target.value || 0))
                  }))
                }
              />
            </FormField>

            <Button type="button" onClick={() => void saveSettings()} disabled={settingsSaving} className={`h-11 px-4 ${adminPrimaryButtonClassName}`}>
              {settingsSaving ? "Сохраняем..." : "Сохранить настройки"}
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: "neutral" | "warning" | "danger" | "muted" }) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]",
        tone === "danger"
          ? "border-rose-200 bg-rose-50"
          : tone === "warning"
            ? "border-amber-200 bg-amber-50"
            : tone === "muted"
              ? "border-slate-200 bg-slate-50"
              : "border-[#dfe5ef] bg-white"
      )}
    >
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{value}</p>
    </div>
  );
}
