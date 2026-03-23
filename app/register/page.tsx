"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AuthRequestTimeoutError, runAuthRequestWithLockRetry } from "@/lib/supabase/auth-request";
import { createClient } from "@/lib/supabase/client";
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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const supabase = createClient();
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error: signUpError } = await runAuthRequestWithLockRetry(() =>
        supabase.auth.signUp({
          email: normalizedEmail,
          password
        })
      );

      if (signUpError) {
        console.error("REGISTER_ERROR", signUpError);
        setError(mapAuthError(signUpError.message || ""));
        return;
      }

      // If email confirmation is disabled, Supabase returns a session immediately.
      if (data.session) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      setMessage("Проверьте email и подтвердите регистрацию, затем выполните вход.");
    } catch (submitError) {
      if (submitError instanceof AuthRequestTimeoutError) {
        console.error("REGISTER_TIMEOUT", submitError);
        setError("Истекло время ожидания. Попробуйте снова.");
        return;
      }
      console.error("REGISTER_THROWN", submitError);
      setError("Не удалось выполнить регистрацию. Попробуйте снова.");
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
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="h-11 border-[#D6D5DD] bg-white text-[#322F55] placeholder:text-[#ADACBB]"
            />
            <Input
              type="password"
              placeholder="Пароль (минимум 6 символов)"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              className="h-11 border-[#D6D5DD] bg-white text-[#322F55] placeholder:text-[#ADACBB]"
            />
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            {message ? <p className="text-sm text-[#654ED6]">{message}</p> : null}
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
