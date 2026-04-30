"use client";

export default function WorkspaceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 text-foreground">
      <section className="w-full max-w-xl rounded-[2rem] border border-border bg-card p-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Ошибка загрузки</p>
        <h1 className="mt-3 text-2xl font-semibold">Не удалось открыть раздел</h1>
        <p className="mt-2 text-sm text-muted-foreground">Повторите попытку. Если ошибка повторится, проверьте данные раздела.</p>
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
