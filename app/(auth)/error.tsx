"use client";

export default function AuthError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <section className="w-full max-w-md rounded-[2rem] border border-border bg-card p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">Не удалось загрузить форму</h1>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition hover:opacity-90"
        >
          Повторить
        </button>
      </section>
    </main>
  );
}
