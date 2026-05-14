"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AuthRequestTimeoutError, runAuthRequestWithLockRetry } from "@/lib/supabase/auth-request";
import { createClient } from "@/lib/supabase/client";
import { mapUiErrorMessage } from "@/lib/ui-error-map";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const errorId = "reset-password-error";
  const messageId = "reset-password-message";

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const flow = query.get("flow");
    const flowFromLink = flow === "recovery";

    const supabase = createClient();
    runAuthRequestWithLockRetry(() => supabase.auth.getUser())
      .then(({ data }) => {
        if (!data.user) {
          setError("Сессия восстановления не найдена. Откройте ссылку из письма ещё раз.");
        } else {
          if (!flowFromLink) {
            console.warn("Reset password page opened without flow=recovery, but session is valid.");
          }
          setReady(true);
        }
      })
      .catch((authError) => {
        console.error("RESET_PASSWORD_GET_USER_ERROR", authError);
        setError("Сессия восстановления не найдена. Откройте ссылку из письма ещё раз.");
      });
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("Пароль должен быть минимум 6 символов");
      return;
    }
    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await runAuthRequestWithLockRetry(() => supabase.auth.updateUser({ password }));
      if (updateError) {
        console.error("RESET_PASSWORD_ERROR", updateError);
        setError(mapUiErrorMessage(updateError.message, "Не удалось обновить пароль. Запросите новую ссылку восстановления."));
        return;
      }

      setMessage("Пароль обновлён. Сейчас перенаправим на вход.");
      setTimeout(() => router.replace("/login"), 1200);
    } catch (submitError) {
      if (submitError instanceof AuthRequestTimeoutError) {
        console.error("RESET_PASSWORD_TIMEOUT", submitError);
        setError("Истекло время ожидания. Попробуйте снова.");
        return;
      }
      console.error("RESET_PASSWORD_THROWN", submitError);
      setError("Не удалось обновить пароль. Запросите новую ссылку восстановления.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#F8F7FC_0%,#F5F4FA_48%,#F3F1F8_100%)] px-4 text-[#322F55]">
      <Card className="w-full max-w-md rounded-2xl border-[#DDD6EE] bg-white shadow-[0_18px_40px_rgba(60,44,118,0.12)]">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-1">
            <h1 className="font-sans text-2xl font-bold">Новый пароль</h1>
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
                placeholder="Минимум 6 символов"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                required
                minLength={6}
                disabled={!ready || loading}
                aria-describedby={error ? errorId : message ? messageId : undefined}
                className="h-11 border-[#D6D5DD] bg-white text-[#322F55] placeholder:text-[#ADACBB]"
              />
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
                minLength={6}
                disabled={!ready || loading}
                aria-describedby={error ? errorId : message ? messageId : undefined}
                className="h-11 border-[#D6D5DD] bg-white text-[#322F55] placeholder:text-[#ADACBB]"
              />
            </div>
            {error ? <p id={errorId} className="text-sm text-rose-600">{error}</p> : null}
            {message ? <p id={messageId} className="text-sm text-[#654ED6]">{message}</p> : null}
            <Button type="submit" className="h-11 w-full rounded-xl bg-[#8D70FF] text-white hover:bg-[#654ED6]" disabled={!ready || loading}>
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
