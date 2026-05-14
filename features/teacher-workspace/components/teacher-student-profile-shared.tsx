"use client";

import { createPortal } from "react-dom";
import { type ReactNode } from "react";

import { Button } from "@/components/ui/button";

export function TeacherStudentProfileDrawer({
  open,
  title,
  onClose,
  children
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="h-dvh w-full max-w-2xl overflow-hidden bg-white shadow-2xl" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="flex h-full flex-col">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#dfe9fb] bg-white px-5 py-4">
            <h3 className="text-lg font-black tracking-[-0.04em] text-slate-900">{title}</h3>
            <Button type="button" variant="secondary" onClick={onClose} className="rounded-2xl px-4 font-bold">
              Закрыть
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function getHomeworkStatusLabel(status: string) {
  if (status === "completed") return "Завершено";
  if (status === "overdue") return "Просрочено";
  if (status === "in_progress") return "В работе";
  return "Не начато";
}

export function EmptyBlock({ text }: { text: string }) {
  return (
    <div className="rounded-[1.35rem] border border-dashed border-[#d7e4f5] bg-[#f8fbff] px-4 py-5 text-sm text-slate-600">
      {text}
    </div>
  );
}
