import * as React from "react";

import { cn } from "@/lib/utils";

type StatusMessageProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: "error" | "success" | "warning";
};

export function StatusMessage({ children, className, tone = "error", ...props }: StatusMessageProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : tone === "warning"
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-rose-200 bg-rose-50 text-rose-700",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
