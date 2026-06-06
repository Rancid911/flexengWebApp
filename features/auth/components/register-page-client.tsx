"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordPolicyChecklist } from "@/components/ui/password-policy-checklist";
import { registerWithPassword } from "@/features/auth/client/auth-api";
import { useAuthRateLimitCountdown } from "@/features/auth/client/use-auth-rate-limit-countdown";
import { getPasswordPolicyError, PASSWORD_MIN_LENGTH } from "@/lib/auth/password-policy";
import { mapUiErrorMessage } from "@/lib/ui-error-map";

function mapAuthError(message: string) {
  return mapUiErrorMessage(message, "Не удалось выполнить регистрацию. Попробуйте ещё раз.");
}

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const rateLimit = useAuthRateLimitCountdown("signup");
  const errorId = "register-form-error";
  const messageId = "register-form-message";
  const visibleError = rateLimit.active ? rateLimit.message : error;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError("");
    setMessage("");
    rateLimit.clear();

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Введите корректный email.");
      return;
    }
    const passwordPolicyError = getPasswordPolicyError(password);
    if (passwordPolicyError) {
      setError(passwordPolicyError);
      return;
    }

    setLoading(true);

    try {
      const data = await registerWithPassword({ email: normalizedEmail, password });

      // If email confirmation is disabled, Supabase returns a session immediately.
      if (data.hasSession) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      setMessage("Проверьте email и подтвердите регистрацию, затем выполните вход.");
    } catch (submitError) {
      console.error("REGISTER_THROWN", submitError);
      if (rateLimit.startFromError(submitError)) return;
      setError(mapAuthError(submitError instanceof Error ? submitError.message : ""));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#F8F7FC_0%,#F5F4FA_48%,#F3F1F8_100%)] px-4 text-[#322F55]">
      <Card className="w-full max-w-md rounded-2xl border-[#DDD6EE] bg-white shadow-[0_18px_40px_rgba(60,44,118,0.12)]">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-1">
            <h1 className="font-sans text-2xl font-bold">Регистрация</h1>
            <p className="text-sm text-[#706E88]">Создайте аккаунт по email и паролю</p>
          </div>

          <form className="space-y-3" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label htmlFor="register-email" className="text-sm font-medium text-[#322F55]">
                Email
              </label>
              <Input
                id="register-email"
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
            <div className="space-y-2">
              <label htmlFor="register-password" className="text-sm font-medium text-[#322F55]">
                Пароль
              </label>
              <Input
                id="register-password"
                type="password"
                placeholder="Минимум 8 символов"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                required
                minLength={PASSWORD_MIN_LENGTH}
                aria-describedby={visibleError ? errorId : message ? messageId : undefined}
                className="h-11 border-[#D6D5DD] bg-white text-[#322F55] placeholder:text-[#ADACBB]"
              />
              <PasswordPolicyChecklist password={password} />
            </div>
            {visibleError ? <p id={errorId} className="text-sm text-rose-600">{visibleError}</p> : null}
            {message ? <p id={messageId} className="text-sm text-[#654ED6]">{message}</p> : null}
            <Button type="submit" className="h-11 w-full rounded-xl bg-[#8D70FF] text-white hover:bg-[#654ED6]" disabled={loading}>
              {loading ? "Регистрация..." : "Зарегистрироваться"}
            </Button>
          </form>

          <p className="text-sm text-[#706E88]">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-[#654ED6] hover:underline">
              Войти
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
