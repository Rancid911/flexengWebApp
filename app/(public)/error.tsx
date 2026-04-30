"use client";

export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12 text-[#322F55]">
      <section className="w-full max-w-xl rounded-[2rem] bg-white/85 p-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7A759F]">Ошибка загрузки</p>
        <h1 className="mt-3 text-2xl font-semibold">Страница временно недоступна</h1>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full bg-[#322F55] px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Повторить
        </button>
      </section>
    </main>
  );
}
