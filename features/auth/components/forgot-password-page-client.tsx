"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/features/auth/client/auth-api";
import { useAuthRateLimitCountdown } from "@/features/auth/client/use-auth-rate-limit-countdown";
import { mapUiErrorMessage } from "@/lib/ui-error-map";

function mapAuthError(message: string) {
  return mapUiErrorMessage(message, "Не удалось отправить ссылку. Попробуйте ещё раз.");
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const rateLimit = useAuthRateLimitCountdown("forgot-password");
  const errorId = "forgot-password-error";
  const messageId = "forgot-password-message";
  const visibleError = rateLimit.active ? rateLimit.message : error;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError("");
    setMessage("");
    rateLimit.clear();
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      await requestPasswordReset({ email: normalizedEmail });

      setMessage("Если аккаунт с таким email существует, мы отправили инструкцию для восстановления пароля.");
    } catch (submitError) {
      console.error("FORGOT_PASSWORD_THROWN", submitError);
      if (rateLimit.startFromError(submitError)) return;
      setError(mapAuthError(submitError instanceof Error ? submitError.message : ""));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#F8F7FC_0%,#F5F4FA_48%,#F3F1F8_100%)] px-4 text-[#322F55]">
      <Card className="w-full max-w-md rounded-2xl border-[#DDD6EE] bg-white text-[#322F55] shadow-[0_18px_40px_rgba(60,44,118,0.12)]">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-1">
            <h1 className="font-sans text-2xl font-bold text-[#322F55]">Восстановление пароля</h1>
            <p className="text-sm text-[#706E88]">Введите email, и мы отправим ссылку для сброса</p>
          </div>

          <form className="space-y-3" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label htmlFor="forgot-password-email" className="text-sm font-medium text-[#322F55]">
                Email
              </label>
              <Input
                id="forgot-password-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                aria-describedby={visibleError ? errorId : message ? messageId : undefined}
                className="h-11 border-[#D6D5DD] bg-white text-[#322F55] placeholder:text-[#ADACBB]"
              />
            </div>
            {visibleError ? <p id={errorId} className="text-sm text-rose-600">{visibleError}</p> : null}
            {message ? <p id={messageId} className="text-sm text-[#654ED6]">{message}</p> : null}
            <Button type="submit" className="h-11 w-full rounded-xl bg-[#8D70FF] text-white hover:bg-[#654ED6]" disabled={loading}>
              {loading ? "Отправка..." : "Отправить ссылку"}
            </Button>
          </form>

          <p className="text-sm text-[#706E88]">
            Вспомнили пароль?{" "}
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
