"use client";

import { useStudentBillingSettingsState } from "@/app/(workspace)/(teacher-zone)/students/[studentId]/use-student-billing-settings-state";
import { EmptyBlock } from "@/app/(workspace)/(teacher-zone)/students/[studentId]/teacher-student-profile-shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { dashboardControlClassName } from "@/components/ui/control-tokens";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusMessage } from "@/components/ui/status-message";
import type { StudentBillingSummary } from "@/lib/billing/types";
import {
  formatBillingBalance,
  formatBillingDebt,
  formatBillingEntryDetails,
  formatBillingEntryValue,
  formatBillingMoneyRemainder,
  formatBillingRemainingMoney,
  getStudentBillingDirectionLabel,
  getStudentBillingReasonLabel
} from "@/lib/billing/utils";

export function TeacherStudentBillingCard({
  canManageBilling,
  billingState,
  billingSummary
}: {
  canManageBilling: boolean;
  billingState: ReturnType<typeof useStudentBillingSettingsState>;
  billingSummary: StudentBillingSummary | null;
}) {
  const {
    billingLoading,
    billingMode,
    lessonPriceAmount,
    billingError,
    billingSaving,
    adjustmentType,
    adjustmentDirection,
    adjustmentValue,
    adjustmentDescription,
    adjustmentSaving,
    setBillingMode,
    setLessonPriceAmount,
    setAdjustmentType,
    setAdjustmentDirection,
    setAdjustmentValue,
    setAdjustmentDescription,
    saveBillingSettings,
    createAdjustment
  } = billingState;
  const billingModeConfigured = billingMode === "package_lessons" || billingMode === "per_lesson_price";

  return (
    <Card className="rounded-[2rem] border-[#dfe9fb] bg-white shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
      <CardContent className="space-y-5 p-6">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black tracking-[-0.04em] text-slate-900">Оплата и списания</h2>
              <p className="text-sm text-slate-600">
                {canManageBilling
                  ? "Спокойный рабочий блок по оплате: текущий статус, настройки списания, корректировки и история операций."
                  : "Текущий режим оплаты, доступные уроки и последние операции по ученику."}
              </p>
            </div>
            {canManageBilling ? (
              <span className="inline-flex rounded-full bg-[#eef5ff] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#1f7aff]">
                Управление оплатой
              </span>
            ) : null}
          </div>

          <div className="rounded-[1.35rem] border border-[#dfe9fb] bg-[#f8fbff] px-4 py-4">
            {billingSummary ? (
              <>
                <p className="text-lg font-black text-slate-900">
                  {formatBillingRemainingMoney(billingSummary) ? `На балансе: ${formatBillingRemainingMoney(billingSummary)}` : `Доступно: ${formatBillingBalance(billingSummary)}`}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
                  <span>{`Доступно: ${formatBillingBalance(billingSummary)}`}</span>
                  {formatBillingMoneyRemainder(billingSummary) ? <span>{`Остаток: ${formatBillingMoneyRemainder(billingSummary)}`}</span> : null}
                  {formatBillingDebt(billingSummary) ? <span>{`Долг: ${formatBillingDebt(billingSummary)}`}</span> : null}
                </div>
              </>
            ) : null}
            {billingLoading ? <p className="mt-3 text-sm text-slate-500">Обновляем данные по оплате…</p> : null}
          </div>

          <div className="space-y-5">
            {!billingModeConfigured ? (
              <div className="rounded-[1.35rem] border border-dashed border-[#dbe5f4] bg-[#f8fbff] px-4 py-4 text-sm text-slate-600">
                Сначала выберите режим оплаты. После этого можно будет сохранить способ списания и, при необходимости, добавить корректировку.
              </div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="flex h-full min-h-[420px] flex-col gap-3 rounded-[1.35rem] border border-[#dfe9fb] bg-white px-4 py-4">
                <p className="font-black text-slate-900">Настройки списания</p>
                <p className="text-sm text-slate-600">Выберите способ, по которому после проведённого урока будут учитываться списания.</p>
                <FormField className="text-sm text-slate-600" label="Режим">
                  <Select className={dashboardControlClassName} value={billingMode} onChange={(event) => setBillingMode(event.target.value)}>
                    <option value="">Не настроено</option>
                    <option value="package_lessons">Пакет уроков</option>
                    <option value="per_lesson_price">Списание по цене урока</option>
                  </Select>
                </FormField>
                {billingMode === "per_lesson_price" ? (
                  <FormField className="text-sm text-slate-600" label="Цена одного урока">
                    <Input
                      className={dashboardControlClassName}
                      value={lessonPriceAmount}
                      onChange={(event) => setLessonPriceAmount(event.target.value)}
                      placeholder="Например, 1800"
                      inputMode="decimal"
                    />
                  </FormField>
                ) : null}
                <Button
                  type="button"
                  onClick={() => void saveBillingSettings()}
                  disabled={billingSaving}
                  className="mt-auto h-auto min-h-11 w-full rounded-2xl bg-[#1f7aff] px-4 py-3 text-center text-sm font-black leading-tight text-white hover:bg-[#1669db] whitespace-normal"
                >
                  {billingSaving ? "Сохраняем..." : "Сохранить режим"}
                </Button>
              </div>

              <div className={`flex h-full min-h-[420px] flex-col gap-3 rounded-[1.35rem] border px-4 py-4 transition ${billingModeConfigured ? "border-[#dfe9fb] bg-white" : "border-[#e6ebf2] bg-slate-50/70"}`}>
                <p className="font-black text-slate-900">Ручная корректировка</p>
                <p className="text-sm text-slate-600">Используйте для переноса остатков и ручного исправления истории оплаты.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField className="text-sm text-slate-600" label="Единица">
                    <Select className={dashboardControlClassName} value={adjustmentType} onChange={(event) => setAdjustmentType(event.target.value as "lesson" | "money")}>
                      <option value="lesson">Уроки</option>
                      <option value="money">Деньги</option>
                    </Select>
                  </FormField>
                  <FormField className="text-sm text-slate-600" label="Операция">
                    <Select className={dashboardControlClassName} value={adjustmentDirection} onChange={(event) => setAdjustmentDirection(event.target.value as "credit" | "debit")}>
                      <option value="credit">Начисление</option>
                      <option value="debit">Списание</option>
                    </Select>
                  </FormField>
                </div>
                <FormField className="text-sm text-slate-600" label={adjustmentType === "lesson" ? "Количество уроков" : "Сумма"}>
                  <Input className={dashboardControlClassName} value={adjustmentValue} onChange={(event) => setAdjustmentValue(event.target.value)} inputMode="decimal" />
                </FormField>
                <FormField className="text-sm text-slate-600" label="Комментарий">
                  <Input className={dashboardControlClassName} value={adjustmentDescription} onChange={(event) => setAdjustmentDescription(event.target.value)} />
                </FormField>
                <Button
                  type="button"
                  onClick={() => void createAdjustment()}
                  disabled={adjustmentSaving || !adjustmentValue.trim()}
                  className="mt-auto h-auto min-h-11 w-full rounded-2xl bg-[#1f7aff] px-4 py-3 text-center text-sm font-black leading-tight text-white hover:bg-[#1669db] whitespace-normal"
                >
                  {adjustmentSaving ? "Сохраняем..." : "Добавить запись"}
                </Button>
              </div>
            </div>
          </div>

          {billingError ? <StatusMessage>{billingError}</StatusMessage> : null}

          <div className="space-y-3 pt-2">
            <div>
              <h3 className="text-lg font-black tracking-[-0.04em] text-slate-900">История операций</h3>
              <p className="text-sm text-slate-600">Последние начисления, списания за уроки и ручные корректировки по ученику.</p>
            </div>
            {billingSummary?.recentEntries?.length ? (
              billingSummary.recentEntries.map((entry) => (
                <div key={entry.id} className="rounded-[1.35rem] border border-[#dfe9fb] bg-white px-4 py-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-black text-slate-900">{getStudentBillingReasonLabel(entry.reason)}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {getStudentBillingDirectionLabel(entry.entryDirection)}
                        {entry.description ? ` · ${entry.description}` : ""}
                      </p>
                      {formatBillingEntryDetails(entry, billingSummary.currency) ? <p className="text-xs text-slate-400">{formatBillingEntryDetails(entry, billingSummary.currency)}</p> : null}
                    </div>
                    <p className="text-sm font-black text-slate-900">{formatBillingEntryValue(entry, billingSummary.currency)}</p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyBlock text="Операций по оплатам и списаниям пока нет." />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
