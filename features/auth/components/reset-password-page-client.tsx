"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordPolicyChecklist } from "@/components/ui/password-policy-checklist";
import { AuthApiError, getCurrentAuthUser, resetPassword } from "@/features/auth/client/auth-api";
import { useAuthRateLimitCountdown } from "@/features/auth/client/use-auth-rate-limit-countdown";
import { getPasswordPolicyError, PASSWORD_MIN_LENGTH } from "@/lib/auth/password-policy";
import { mapUiErrorMessage } from "@/lib/ui-error-map";

const RECOVERY_CONTEXT_ERROR = "Ссылка для восстановления пароля истекла или недействительна. Запросите новое письмо для восстановления пароля.";

function mapResetPasswordSubmitError(error: unknown) {
  if (error instanceof AuthApiError) {
    if (process.env.NODE_ENV !== "production") {
      console.error("RESET_PASSWORD_API_ERROR", {
        status: error.status,
        code: error.code,
        message: error.message,
        details: error.details
      });
    }

    const fieldErrors = error.details?.fieldErrors ?? {};
    const nextPasswordError = fieldErrors.nextPassword?.[0] || fieldErrors.password?.[0];
    if (nextPasswordError) return nextPasswordError;

    const formError = error.details?.formErrors?.[0];
    if (formError) return formError;

    if (error.code === "RECOVERY_CONTEXT_REQUIRED") {
      return RECOVERY_CONTEXT_ERROR;
    }
  }

  return mapUiErrorMessage(error instanceof Error ? error.message : "", "Не удалось обновить пароль. Запросите новую ссылку восстановления.");
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const rateLimit = useAuthRateLimitCountdown("reset-password");
  const errorId = "reset-password-error";
  const messageId = "reset-password-message";
  const isRateLimited = rateLimit.active;
  const visibleError = isRateLimited ? rateLimit.message : error;

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const flow = query.get("flow");
    const flowFromLink = flow === "recovery";

    getCurrentAuthUser()
      .then(({ user }) => {
        if (!flowFromLink) {
          console.warn("Reset password page opened without flow=recovery, but session is valid.");
        }
        if (!user) {
          setError("Сессия восстановления не найдена. Откройте ссылку из письма ещё раз.");
          return;
        }
        setReady(true);
      })
      .catch((authError) => {
        console.error("RESET_PASSWORD_GET_USER_ERROR", authError);
        setError("Сессия восстановления не найдена. Откройте ссылку из письма ещё раз.");
      });
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || isRateLimited) return;
    setError("");
    setMessage("");

    const passwordPolicyError = getPasswordPolicyError(password);
    if (passwordPolicyError) {
      setError(passwordPolicyError);
      return;
    }
    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ nextPassword: password });
      rateLimit.clear();

      setMessage("Пароль обновлён. Сейчас перенаправим на вход.");
      setTimeout(() => router.replace("/login"), 1200);
    } catch (submitError) {
      if (rateLimit.startFromError(submitError)) return;
      setError(mapResetPasswordSubmitError(submitError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#F8F7FC_0%,#F5F4FA_48%,#F3F1F8_100%)] px-4 text-[#322F55]">
      <Card className="w-full max-w-md rounded-2xl border-[#DDD6EE] bg-white text-[#322F55] shadow-[0_18px_40px_rgba(60,44,118,0.12)]">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-1">
            <h1 className="font-sans text-2xl font-bold text-[#322F55]">Новый пароль</h1>
            <p className="text-sm text-[#706E88]">Установите новый пароль для аккаунта</p>
          </div>

          <form className="space-y-3" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label htmlFor="reset-password-new" className="text-sm font-medium text-[#322F55]">
                Новый пароль
              </label>
              <Input
                id="reset-password-new"
                type="password"
                placeholder="Минимум 8 символов"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                required
                minLength={PASSWORD_MIN_LENGTH}
                disabled={!ready || loading}
                aria-describedby={visibleError ? errorId : message ? messageId : undefined}
                className="h-11 border-[#D6D5DD] bg-white text-[#322F55] placeholder:text-[#ADACBB]"
              />
              <PasswordPolicyChecklist password={password} />
            </div>
            <div className="space-y-2">
              <label htmlFor="reset-password-confirm" className="text-sm font-medium text-[#322F55]">
                Повторите пароль
              </label>
              <Input
                id="reset-password-confirm"
                type="password"
                placeholder="Повторите новый пароль"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
                minLength={PASSWORD_MIN_LENGTH}
                disabled={!ready || loading}
                aria-describedby={visibleError ? errorId : message ? messageId : undefined}
                className="h-11 border-[#D6D5DD] bg-white text-[#322F55] placeholder:text-[#ADACBB]"
              />
            </div>
            {visibleError ? <p id={errorId} className="text-sm text-rose-600">{visibleError}</p> : null}
            {message ? <p id={messageId} className="text-sm text-[#654ED6]">{message}</p> : null}
            <Button type="submit" className="h-11 w-full rounded-xl bg-[#8D70FF] text-white hover:bg-[#654ED6]" disabled={!ready || loading || isRateLimited}>
              {loading ? "Сохранение..." : "Обновить пароль"}
            </Button>
          </form>

          <p className="text-sm text-[#706E88]">
            <Link href="/login" className="text-[#654ED6] hover:underline">
              Вернуться ко входу
            </Link>
          </p>
          <p className="text-sm text-[#706E88]">
            <Link href="/" className="text-[#654ED6] hover:underline">
              Вернуться на главную страницу
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
