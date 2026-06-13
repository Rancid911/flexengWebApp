"use client";

import { FormEvent, type ReactNode, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { collectTrackingData } from "@/features/marketing/lib/collect-tracking-data";
import { focusFirstInvalidField } from "@/lib/forms/focus-first-invalid-field";
import { backspaceRuPhone, isValidRuPhone, normalizeRuPhoneInput } from "@/lib/phone";
import { cn } from "@/lib/utils";

type LeadFormData = {
  name: string;
  phone: string;
  email: string;
  audience: "child" | "adult" | "";
  consentPersonalData: boolean;
  consentMarketing: boolean;
};

type LeadFormErrors = Partial<Record<keyof LeadFormData, string>>;

const initialForm: LeadFormData = {
  name: "",
  phone: "+7 ",
  email: "",
  audience: "",
  consentPersonalData: false,
  consentMarketing: false
};

type LeadFormProps = {
  variant?: "light" | "dark";
  compactEmail?: boolean;
  framed?: boolean;
  stackedFields?: boolean;
  compact?: boolean;
  showAgreementText?: boolean;
  source?: string;
  formType?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  successMessage?: string;
  additionalMetadata?: Record<string, unknown>;
  includeTrackingData?: boolean;
  submitTone?: "default" | "coral";
};

function validate(form: LeadFormData): LeadFormErrors {
  const errors: LeadFormErrors = {};

  if (!form.name.trim()) errors.name = "Введите имя";
  if (!form.email.trim()) {
    errors.email = "Введите email";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Введите корректный email";
  }

  if (!form.phone.trim()) {
    errors.phone = "Введите телефон";
  } else if (!isValidRuPhone(form.phone)) {
    errors.phone = "Телефон должен быть в формате +7 (999) 999 99 99";
  }

  if (!form.audience) {
    errors.audience = "Выберите, для кого обучение";
  }

  if (!form.consentPersonalData) {
    errors.consentPersonalData = "Требуется согласие на обработку персональных данных";
  }

  return errors;
}

export function LeadForm({
  variant = "light",
  compactEmail = false,
  framed = true,
  stackedFields = false,
  compact = false,
  showAgreementText = true,
  source = "website",
  formType = "main_lead_form",
  title = "Оставить заявку",
  description = "Оставьте контакты. Мы свяжемся с вами и подберём программу.",
  submitLabel = "Отправить заявку",
  successMessage = "Заявка отправлена. Мы скоро свяжемся с вами.",
  additionalMetadata,
  includeTrackingData = false,
  submitTone = "default"
}: LeadFormProps) {
  const generatedId = useId();
  const idPrefix = `lead-${generatedId.replace(/:/g, "")}`;
  const fieldIds = {
    name: `${idPrefix}-name`,
    phone: `${idPrefix}-phone`,
    email: `${idPrefix}-email`,
    audienceChild: `${idPrefix}-audience-child`,
    audienceAdult: `${idPrefix}-audience-adult`,
    consentPersonalData: `${idPrefix}-consent-personal-data`,
    consentMarketing: `${idPrefix}-consent-marketing`
  };
  const audienceName = `${idPrefix}-audience`;
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const audienceInputRef = useRef<HTMLInputElement | null>(null);
  const consentInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState<LeadFormData>(initialForm);
  const [errors, setErrors] = useState<LeadFormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDark = variant === "dark";

  function updateField<K extends keyof LeadFormData>(key: K, value: LeadFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(form);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setSubmitted(false);
      setSubmitError("");
      focusFirstInvalidField(nextErrors, {
        audience: audienceInputRef.current,
        consentPersonalData: consentInputRef.current,
        email: emailInputRef.current,
        name: nameInputRef.current,
        phone: phoneInputRef.current
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    try {
      const trackingData = includeTrackingData ? collectTrackingData() : {};
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          source,
          form_type: formType,
          page_url: window.location.href,
          metadata: {
            ...additionalMetadata,
            ...trackingData,
            audience: form.audience,
            consent_personal_data: form.consentPersonalData,
            consent_marketing: form.consentMarketing
          }
        })
      });

      if (!response.ok) {
        throw new Error("Не удалось отправить заявку. Попробуйте ещё раз.");
      }

      setSubmitted(true);
      setErrors({});
      setForm(initialForm);
    } catch (error) {
      setSubmitted(false);
      setSubmitError(error instanceof Error ? error.message : "Не удалось отправить заявку. Попробуйте ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const formBody = (
    <>
      {!framed ? (
        <div className={cn("space-y-2", compact ? "mb-2 md:mb-4" : "mb-4")}>
          <h3 className={cn(isDark ? "font-bold text-white" : "font-bold text-[#322F55]", compact ? "text-xl md:text-2xl" : "text-2xl")}>{title}</h3>
          <p className={cn(isDark ? "text-[#D0CAE9]" : "text-[#706E88]", compact ? "text-xs leading-5 md:text-sm md:leading-normal" : "text-sm")}>
            {description}
          </p>
        </div>
      ) : null}
      <form aria-label={title} className={cn("space-y-4", stackedFields && "space-y-2", compact && "space-y-2")} onSubmit={onSubmit} noValidate>
          <div className={cn("grid gap-4", stackedFields ? "gap-2 sm:grid-cols-1" : "sm:grid-cols-2")}>
            <FieldLabel label="Имя" htmlFor={fieldIds.name} error={errors.name} isDark={isDark} compact={stackedFields || compact}>
              <Input
                id={fieldIds.name}
                ref={nameInputRef}
                type="text"
                name="name"
                autoComplete="name"
                placeholder="Иван…"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                aria-invalid={errors.name ? "true" : "false"}
                aria-describedby={errors.name ? `${fieldIds.name}-error` : undefined}
                className={
                  cn(
                    compact && "h-10",
                    isDark
                      ? "border-[#6E669C] bg-[#453F6E] text-white placeholder:text-[#B8B1D8]"
                      : "border-[#D6D5DD] bg-white text-[#322F55] placeholder:text-[#ADACBB]"
                  )
                }
              />
            </FieldLabel>
            <FieldLabel label="Телефон" htmlFor={fieldIds.phone} error={errors.phone} isDark={isDark} compact={stackedFields || compact}>
              <Input
                id={fieldIds.phone}
                ref={phoneInputRef}
                type="tel"
                name="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="+7 (999) 999 99 99…"
                value={form.phone}
                onChange={(event) => updateField("phone", normalizeRuPhoneInput(event.target.value))}
                aria-invalid={errors.phone ? "true" : "false"}
                aria-describedby={errors.phone ? `${fieldIds.phone}-error` : undefined}
                onKeyDown={(event) => {
                  if (event.key === "Backspace" && event.currentTarget.selectionStart === event.currentTarget.selectionEnd) {
                    event.preventDefault();
                    updateField("phone", backspaceRuPhone(form.phone));
                    return;
                  }
                }}
                className={
                  cn(
                    compact && "h-10",
                    isDark
                      ? "border-[#6E669C] bg-[#453F6E] text-white placeholder:text-[#B8B1D8]"
                      : "border-[#D6D5DD] bg-white text-[#322F55] placeholder:text-[#ADACBB]"
                  )
                }
              />
            </FieldLabel>
          </div>

          <div className={cn("grid gap-4", stackedFields && "gap-2", compactEmail ? "sm:grid-cols-[minmax(0,360px)]" : "sm:grid-cols-1")}>
            <FieldLabel label="Email" htmlFor={fieldIds.email} error={errors.email} isDark={isDark} compact={stackedFields || compact}>
              <Input
                id={fieldIds.email}
                ref={emailInputRef}
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                spellCheck={false}
                placeholder="you@example.com…"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? `${fieldIds.email}-error` : undefined}
                className={
                  cn(
                    compact && "h-10",
                    isDark
                      ? "border-[#6E669C] bg-[#453F6E] text-white placeholder:text-[#B8B1D8]"
                      : "border-[#D6D5DD] bg-white text-[#322F55] placeholder:text-[#ADACBB]"
                  )
                }
              />
            </FieldLabel>
          </div>

          <fieldset className={cn("space-y-2", stackedFields && "space-y-1")}>
            <legend className={cn(isDark ? "font-semibold text-[#E8E3FF]" : "font-semibold text-[#322F55]", compact ? "text-xs md:text-sm" : "text-sm")}>Для кого</legend>
            <div className={cn("grid gap-2", compact ? "grid-cols-2 md:flex md:flex-wrap" : "flex flex-wrap")}>
              <AudienceOption
                label="Для ребёнка"
                value="child"
                checked={form.audience === "child"}
                onChange={(value) => updateField("audience", value)}
                isDark={isDark}
                compact={compact}
                inputRef={audienceInputRef}
                inputId={fieldIds.audienceChild}
                inputName={audienceName}
              />
              <AudienceOption
                label="Для взрослого"
                value="adult"
                checked={form.audience === "adult"}
                onChange={(value) => updateField("audience", value)}
                isDark={isDark}
                compact={compact}
                inputId={fieldIds.audienceAdult}
                inputName={audienceName}
              />
            </div>
            {errors.audience ? <span className="block text-xs font-medium text-rose-600">{errors.audience}</span> : null}
          </fieldset>

          <div className={cn("space-y-3", compact && "space-y-2")}>
            <ConsentCheckbox
              checked={form.consentPersonalData}
              onChange={(checked) => updateField("consentPersonalData", checked)}
              isDark={isDark}
              required
              error={errors.consentPersonalData}
              compact={compact}
              inputRef={consentInputRef}
              inputId={fieldIds.consentPersonalData}
            >
              Даю согласие на обработку персональных данных в соответствии с политикой конфиденциальности.
            </ConsentCheckbox>
            <ConsentCheckbox
              checked={form.consentMarketing}
              onChange={(checked) => updateField("consentMarketing", checked)}
              isDark={isDark}
              compact={compact}
              inputId={fieldIds.consentMarketing}
            >
              Соглашаюсь на получение информационных и рекламных сообщений.
            </ConsentCheckbox>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                compact ? "h-10 w-full rounded-lg px-4 md:h-11 md:w-auto md:rounded-xl md:px-6" : "h-11 rounded-xl px-6",
                submitTone === "coral" || isDark
                  ? "bg-[#F76D63] text-white hover:bg-[#E05B51]"
                  : "bg-[#8D70FF] text-white hover:bg-[#654ED6]"
              )}
            >
              {isSubmitting ? "Отправляем..." : submitLabel}
            </Button>
            {submitted ? (
              <p role="status" aria-live="polite" className={isDark ? "text-sm font-medium text-[#F5D7D4]" : "text-sm font-medium text-[#654ED6]"}>
                {successMessage}
              </p>
            ) : null}
          </div>
          {submitError ? <p role="alert" className="text-sm font-medium text-rose-600">{submitError}</p> : null}
          {showAgreementText ? (
            <p className={isDark ? "text-xs text-[#B8B1D8]" : "text-xs text-[#706E88]"}>
              Нажимая кнопку отправки, вы принимаете пользовательское соглашение и подтверждаете достоверность указанных данных.
            </p>
          ) : null}
      </form>
    </>
  );

  if (!framed) {
    return <div className="h-full">{formBody}</div>;
  }

  return (
    <Card
      className={
        isDark
          ? "rounded-3xl border-[#5F568D] bg-[linear-gradient(160deg,#322F55_0%,#4B4475_100%)] shadow-[0_18px_48px_rgba(25,18,46,0.45)]"
          : "rounded-3xl border-[#D6D5DD] bg-white shadow-sm"
      }
    >
      <CardHeader className="space-y-2">
        <CardTitle className={isDark ? "text-2xl font-bold text-white" : "text-2xl font-bold text-[#322F55]"}>{title}</CardTitle>
        <p className={isDark ? "text-sm text-[#D0CAE9]" : "text-sm text-[#706E88]"}>
          {description}
        </p>
      </CardHeader>
      <CardContent>{formBody}</CardContent>
    </Card>
  );
}

function AudienceOption({
  label,
  value,
  checked,
  onChange,
  isDark,
  compact,
  inputRef,
  inputId,
  inputName
}: {
  label: string;
  value: "child" | "adult";
  checked: boolean;
  onChange: (value: "child" | "adult") => void;
  isDark: boolean;
  compact?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  inputId: string;
  inputName: string;
}) {
  return (
    <label htmlFor={inputId} className="cursor-pointer">
      <input id={inputId} ref={inputRef} type="radio" className="sr-only" name={inputName} checked={checked} onChange={() => onChange(value)} />
      <span
        className={cn(
          "inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors",
          compact && "w-full px-2 text-xs md:w-auto md:px-4 md:text-sm",
          checked
            ? isDark
              ? "border-[#8D70FF] bg-[#5A4E95] text-white"
              : "border-[#654ED6] bg-[#F1ECFF] text-[#3A2D8E]"
            : isDark
              ? "border-[#6E669C] bg-[#453F6E] text-[#E0DBF4] hover:bg-[#4F4778]"
              : "border-[#D6D5DD] bg-white text-[#5E5A7A] hover:bg-[#F7F5FC]"
        )}
      >
        {label}
      </span>
    </label>
  );
}

function FieldLabel({
  label,
  htmlFor,
  error,
  isDark = false,
  compact = false,
  children
}: {
  label: string;
  htmlFor: string;
  error?: string;
  isDark?: boolean;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className={cn("space-y-2", compact && "space-y-1")}>
      <span className={isDark ? "text-sm font-semibold text-[#E8E3FF]" : "text-sm font-semibold text-[#322F55]"}>{label}</span>
      {children}
      {error ? <span id={`${htmlFor}-error`} className="block text-xs font-medium text-rose-600">{error}</span> : null}
    </label>
  );
}

function ConsentCheckbox({
  checked,
  onChange,
  children,
  isDark,
  required = false,
  error,
  compact = false,
  inputRef,
  inputId
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  isDark: boolean;
  required?: boolean;
  error?: string;
  compact?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  inputId: string;
}) {
  return (
    <label htmlFor={inputId} className="block">
      <span className="flex items-start gap-2.5">
        <input
          id={inputId}
          ref={inputRef}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className={
            isDark
              ? "mt-1 h-4 w-4 rounded border-[#8A82B4] bg-[#453F6E] text-[#F76D63] focus:ring-[#8D70FF]"
              : "mt-1 h-4 w-4 rounded border-[#B9B3CD] text-[#8D70FF] focus:ring-[#8D70FF]"
          }
          required={required}
        />
        <span className={cn(isDark ? "text-[#D0CAE9]" : "text-[#5E5A7A]", compact ? "text-xs leading-4 md:text-sm md:leading-normal" : "text-sm")}>{children}</span>
      </span>
      {error ? <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span> : null}
    </label>
  );
}
