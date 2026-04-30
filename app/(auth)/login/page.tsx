"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AuthRequestTimeoutError, runAuthRequestWithLockRetry } from "@/lib/supabase/auth-request";
import { createClient } from "@/lib/supabase/client";
import { mapUiErrorMessage } from "@/lib/ui-error-map";

function mapAuthError(message: string) {
  return mapUiErrorMessage(message, "Не удалось выполнить вход. Попробуйте снова.");
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const confirmError = searchParams.get("error") === "auth_confirm_failed";
  const errorId = "login-form-error";
  const confirmErrorId = "login-form-confirm-error";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const normalizedEmail = email.trim().toLowerCase();
      const { error: signInError } = await runAuthRequestWithLockRetry(() =>
        supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        })
      );

      if (signInError) {
        console.error("LOGIN_ERROR", signInError);
        setError(mapAuthError(signInError.message || ""));
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (submitError) {
      if (submitError instanceof AuthRequestTimeoutError) {
        console.error("LOGIN_TIMEOUT", submitError);
        setError("Истекло время ожидания. Попробуйте снова.");
        return;
      }
      console.error("LOGIN_THROWN", submitError);
      setError("Не удалось выполнить вход. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#F8F7FC_0%,#F5F4FA_48%,#F3F1F8_100%)] px-4 text-[#322F55]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-16 rotate-[-18deg] text-[72px] font-black tracking-[0.18em] text-[#8D70FF]/[0.07] sm:text-[110px]">
          ФЛЕКСЕНГ
        </div>
        <div className="absolute right-[-140px] top-[22%] rotate-[14deg] text-[64px] font-black tracking-[0.2em] text-[#654ED6]/[0.06] sm:text-[120px]">
          ФЛЕКСЕНГ
        </div>
        <div className="absolute left-[-60px] bottom-[18%] rotate-[-10deg] text-[52px] font-bold tracking-[0.26em] text-[#8D70FF]/[0.05] sm:text-[92px]">
          ФЛЕКСЕНГ
        </div>
        <div className="absolute -right-16 bottom-10 rotate-[8deg] text-[56px] font-bold tracking-[0.2em] text-[#654ED6]/[0.05] sm:text-[96px]">
          ФЛЕКСЕНГ
        </div>
        <div className="absolute left-[6%] top-[40%] rotate-[-8deg] text-[36px] font-black tracking-[0.22em] text-[#8D70FF]/[0.06] sm:text-[64px]">
          ФЛЕКСЕНГ
        </div>
        <div className="absolute right-[8%] top-[58%] rotate-[12deg] text-[34px] font-black tracking-[0.2em] text-[#654ED6]/[0.05] sm:text-[60px]">
          ФЛЕКСЕНГ
        </div>
        <div className="absolute left-[18%] top-[12%] rotate-[24deg] text-[24px] font-semibold tracking-[0.24em] text-[#8D70FF]/[0.06] sm:text-[40px]">
          ФЛЕКСЕНГ
        </div>
        <div className="absolute right-[20%] bottom-[16%] rotate-[-16deg] text-[24px] font-semibold tracking-[0.24em] text-[#654ED6]/[0.06] sm:text-[42px]">
          ФЛЕКСЕНГ
        </div>
        <div className="absolute left-[42%] bottom-[8%] rotate-[6deg] text-[22px] font-semibold tracking-[0.2em] text-[#8D70FF]/[0.05] sm:text-[34px]">
          ФЛЕКСЕНГ
        </div>
        <div className="absolute right-[38%] top-[6%] rotate-[-6deg] text-[22px] font-semibold tracking-[0.2em] text-[#654ED6]/[0.05] sm:text-[34px]">
          ФЛЕКСЕНГ
        </div>
      </div>

      <Card className="relative z-10 w-full max-w-md rounded-2xl border-[#DDD6EE] bg-white shadow-[0_18px_40px_rgba(60,44,118,0.12)]">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-1">
            <h1 className="font-sans text-2xl font-bold">Вход</h1>
            <p className="text-sm text-[#706E88]">Войдите по email и паролю</p>
          </div>

          <form className="space-y-3" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label htmlFor="login-email" className="text-sm font-medium text-[#322F55]">
                Email
              </label>
              <Input
                id="login-email"
                data-testid="login-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                aria-describedby={error ? errorId : undefined}
                className="h-11 border-[#D6D5DD] bg-white text-[#322F55] placeholder:text-[#ADACBB]"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="login-password" className="text-sm font-medium text-[#322F55]">
                Пароль
              </label>
              <Input
                id="login-password"
                data-testid="login-password"
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                aria-describedby={error ? errorId : undefined}
                className="h-11 border-[#D6D5DD] bg-white text-[#322F55] placeholder:text-[#ADACBB]"
              />
            </div>
            {error ? <p id={errorId} className="text-sm text-rose-600">{error}</p> : null}
            {confirmError ? <p id={confirmErrorId} className="text-sm text-rose-600">Ссылка подтверждения недействительна или устарела.</p> : null}
            <Button
              data-testid="login-submit"
              type="submit"
              className="h-11 w-full rounded-xl bg-[#8D70FF] text-white hover:bg-[#654ED6]"
              disabled={loading}
            >
              {loading ? "Вход..." : "Войти"}
            </Button>
          </form>

          <div className="space-y-2 text-sm text-[#706E88]">
            <p>
              Нет аккаунта?{" "}
              <Link href="/register" className="text-[#654ED6] hover:underline">
                Регистрация
              </Link>
            </p>
            <p>
              <Link href="/forgot-password" className="text-[#654ED6] hover:underline">
                Забыли пароль?
              </Link>
            </p>
            <p>
              <Link href="/" className="text-[#654ED6] hover:underline">
                Вернуться на главную страницу
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
