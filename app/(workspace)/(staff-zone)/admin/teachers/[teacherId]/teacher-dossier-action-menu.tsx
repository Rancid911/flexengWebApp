"use client";

import { MoreHorizontal } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function TeacherDossierActionMenu({ onEdit }: { onEdit: () => void }) {
  const [open, setOpen] = useState(false);

  const editBlock = () => {
    setOpen(false);
    onEdit();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          aria-label="Действия блока"
          className="h-10 w-10 rounded-2xl bg-transparent p-0 text-slate-500 hover:bg-[#eef5ff] hover:text-slate-900"
        >
          <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 border-[#dfe9fb] bg-white p-2 text-slate-900 shadow-lg">
        <button
          type="button"
          onClick={editBlock}
          className="flex h-10 w-full items-center rounded-xl px-3 text-left text-sm font-normal text-slate-900 transition hover:bg-[#eef5ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7aff]"
        >
          Редактировать
        </button>
      </PopoverContent>
    </Popover>
  );
}
