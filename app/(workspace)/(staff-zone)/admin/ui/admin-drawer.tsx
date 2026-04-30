"use client";

import { createPortal } from "react-dom";
import type { CSSProperties, ReactNode } from "react";

import { Button } from "@/components/ui/button";

export function AdminDrawer({
  open,
  title,
  onClose,
  children,
  widthClass = "max-w-xl"
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  widthClass?: string;
}) {
  if (!open || typeof document === "undefined") return null;

  const drawerThemeVars = {
    "--background": "210 20% 97%",
    "--foreground": "222 26% 20%",
    "--card": "0 0% 100%",
    "--card-foreground": "222 26% 20%",
    "--popover": "0 0% 100%",
    "--popover-foreground": "222 26% 20%",
    "--primary": "247 63% 55%",
    "--primary-foreground": "0 0% 100%",
    "--secondary": "210 20% 94%",
    "--secondary-foreground": "222 26% 20%",
    "--muted": "210 16% 90%",
    "--muted-foreground": "220 8% 45%",
    "--accent": "210 14% 92%",
    "--accent-foreground": "222 26% 20%",
    "--border": "210 14% 86%",
    "--input": "210 14% 86%",
    "--ring": "247 63% 55%"
  } as CSSProperties;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 text-foreground" style={drawerThemeVars} onClick={onClose}>
      <div
        className={`h-dvh w-full ${widthClass} overflow-hidden bg-card`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="h-full overflow-y-auto">
          <div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-card px-5">
            <h2 className="font-sans text-xl font-semibold">{title}</h2>
            <Button variant="secondary" onClick={onClose} type="button">
              Закрыть
            </Button>
          </div>
          <div className="px-5 pb-5 pt-4">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
