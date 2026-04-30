"use client";

import { FormEvent, type ReactNode, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { backspaceRuPhone, isValidRuPhone, normalizeRuPhoneInput } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { focusFirstInvalidField } from "@/lib/forms/focus-first-invalid-field";

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
  showAgreementText?: boolean;
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
  showAgreementText = true
}: LeadFormProps) {
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
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          source: "website",
          form_type: "main_lead_form",
          page_url: window.location.href,
          metadata: {
            audience: form.audience,
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
        <div className="mb-4 space-y-2">
          <h3 className={isDark ? "text-2xl font-bold text-white" : "text-2xl font-bold text-[#322F55]"}>Оставить заявку</h3>
          <p className={isDark ? "text-sm text-[#D0CAE9]" : "text-sm text-[#706E88]"}>
            Оставьте контакты. Мы свяжемся с вами и подберём программу.
          </p>
        </div>
      ) : null}
      <form className={cn("space-y-4", stackedFields && "space-y-2")} onSubmit={onSubmit} noValidate>
          <div className={cn("grid gap-4", stackedFields ? "gap-2 sm:grid-cols-1" : "sm:grid-cols-2")}>
            <FieldLabel label="Имя" htmlFor="lead-name" error={errors.name} isDark={isDark} compact={stackedFields}>
              <Input
                id="lead-name"
                ref={nameInputRef}
                type="text"
                name="name"
                autoComplete="name"
                placeholder="Иван…"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                aria-invalid={errors.name ? "true" : "false"}
                aria-describedby={errors.name ? "lead-name-error" : undefined}
                className={
                  isDark
                    ? "border-[#6E669C] bg-[#453F6E] text-white placeholder:text-[#B8B1D8]"
                    : "border-[#D6D5DD] bg-white text-[#322F55] placeholder:text-[#ADACBB]"
                }
              />
            </FieldLabel>
            <FieldLabel label="Телефон" htmlFor="lead-phone" error={errors.phone} isDark={isDark} compact={stackedFields}>
              <Input
                id="lead-phone"
                ref={phoneInputRef}
                type="tel"
                name="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="+7 (999) 999 99 99…"
                value={form.phone}
                onChange={(event) => updateField("phone", normalizeRuPhoneInput(event.target.value))}
                aria-invalid={errors.phone ? "true" : "false"}
                aria-describedby={errors.phone ? "lead-phone-error" : undefined}
                onKeyDown={(event) => {
                  if (event.key === "Backspace" && event.currentTarget.selectionStart === event.currentTarget.selectionEnd) {
                    event.preventDefault();
                    updateField("phone", backspaceRuPhone(form.phone));
                    return;
                  }
                }}
                className={
                  isDark
                    ? "border-[#6E669C] bg-[#453F6E] text-white placeholder:text-[#B8B1D8]"
                    : "border-[#D6D5DD] bg-white text-[#322F55] placeholder:text-[#ADACBB]"
                }
              />
            </FieldLabel>
          </div>

          <div className={cn("grid gap-4", stackedFields && "gap-2", compactEmail ? "sm:grid-cols-[minmax(0,360px)]" : "sm:grid-cols-1")}>
            <FieldLabel label="Email" htmlFor="lead-email" error={errors.email} isDark={isDark} compact={stackedFields}>
              <Input
                id="lead-email"
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
                aria-describedby={errors.email ? "lead-email-error" : undefined}
                className={
                  isDark
                    ? "border-[#6E669C] bg-[#453F6E] text-white placeholder:text-[#B8B1D8]"
                    : "border-[#D6D5DD] bg-white text-[#322F55] placeholder:text-[#ADACBB]"
                }
              />
            </FieldLabel>
          </div>

          <fieldset className={cn("space-y-2", stackedFields && "space-y-1")}>
            <legend className={isDark ? "text-sm font-semibold text-[#E8E3FF]" : "text-sm font-semibold text-[#322F55]"}>Для кого</legend>
            <div className="flex flex-wrap gap-2">
              <AudienceOption
                label="Для ребёнка"
                value="child"
                checked={form.audience === "child"}
                onChange={(value) => updateField("audience", value)}
                isDark={isDark}
                inputRef={audienceInputRef}
              />
              <AudienceOption
                label="Для взрослого"
                value="adult"
                checked={form.audience === "adult"}
                onChange={(value) => updateField("audience", value)}
                isDark={isDark}
              />
            </div>
            {errors.audience ? <span className="block text-xs font-medium text-rose-600">{errors.audience}</span> : null}
          </fieldset>

          <div className="space-y-3">
            <ConsentCheckbox
              checked={form.consentPersonalData}
              onChange={(checked) => updateField("consentPersonalData", checked)}
              isDark={isDark}
              required
              error={errors.consentPersonalData}
              inputRef={consentInputRef}
            >
              Даю согласие на обработку персональных данных в соответствии с политикой конфиденциальности.
            </ConsentCheckbox>
            <ConsentCheckbox
              checked={form.consentMarketing}
              onChange={(checked) => updateField("consentMarketing", checked)}
              isDark={isDark}
            >
              Соглашаюсь на получение информационных и рекламных сообщений.
            </ConsentCheckbox>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="submit"
              disabled={isSubmitting}
              className={isDark ? "h-11 rounded-xl bg-[#F76D63] px-6 text-white hover:bg-[#E05B51]" : "h-11 rounded-xl bg-[#8D70FF] px-6 text-white hover:bg-[#654ED6]"}
            >
              {isSubmitting ? "Отправляем..." : "Отправить заявку"}
            </Button>
            {submitted ? (
              <p role="status" aria-live="polite" className={isDark ? "text-sm font-medium text-[#F5D7D4]" : "text-sm font-medium text-[#654ED6]"}>
                Заявка отправлена. Мы скоро свяжемся с вами.
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
        <CardTitle className={isDark ? "text-2xl font-bold text-white" : "text-2xl font-bold text-[#322F55]"}>Оставить заявку</CardTitle>
        <p className={isDark ? "text-sm text-[#D0CAE9]" : "text-sm text-[#706E88]"}>
          Оставьте контакты. Мы свяжемся с вами и подберём программу.
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
  inputRef
}: {
  label: string;
  value: "child" | "adult";
  checked: boolean;
  onChange: (value: "child" | "adult") => void;
  isDark: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <label className="cursor-pointer">
      <input ref={inputRef} type="radio" className="sr-only" name="lead-audience" checked={checked} onChange={() => onChange(value)} />
      <span
        className={cn(
          "inline-flex h-10 items-center rounded-lg border px-4 text-sm font-medium transition-colors",
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
  inputRef
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  isDark: boolean;
  required?: boolean;
  error?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <label className="block">
      <span className="flex items-start gap-2.5">
        <input
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
        <span className={isDark ? "text-sm text-[#D0CAE9]" : "text-sm text-[#5E5A7A]"}>{children}</span>
      </span>
      {error ? <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span> : null}
    </label>
  );
}
