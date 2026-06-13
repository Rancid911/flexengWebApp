"use client";

import { Button } from "@/components/ui/button";

export function AdminMaterialTypeModal({
  open,
  onClose,
  onSelectCards,
  onSelectTest
}: {
  open: boolean;
  onClose: () => void;
  onSelectCards: () => void;
  onSelectTest: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 space-y-1">
          <h2 className="text-lg font-semibold text-slate-900">Создать материал</h2>
          <p className="text-sm text-slate-500">Выберите тип учебного материала.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-white"
            onClick={onSelectTest}
          >
            <span className="block text-sm font-semibold text-slate-900">Тест / тренажёр</span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">Текущий конструктор вопросов, тестов и тренажёров.</span>
          </button>
          <button
            type="button"
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-white"
            onClick={onSelectCards}
          >
            <span className="block text-sm font-semibold text-slate-900">Карточки</span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">Набор слов с CEFR, темой, переводами и примерами.</span>
          </button>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Отмена
          </Button>
        </div>
      </div>
    </div>
  );
}
