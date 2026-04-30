import * as React from "react";

import { cn } from "@/lib/utils";

type FormFieldProps = React.HTMLAttributes<HTMLDivElement> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  labelClassName?: string;
};

export function FormField({
  children,
  className,
  error,
  hint,
  label,
  labelClassName,
  ...props
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1", className)} {...props}>
      {label ? <label className={cn("text-sm text-muted-foreground", labelClassName)}>{label}</label> : null}
      {children}
      {error ? <p className="text-xs text-red-500">{error}</p> : hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

type CheckboxFieldProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  hint?: React.ReactNode;
  inputClassName?: string;
  label: React.ReactNode;
};

export function CheckboxField({
  children,
  className,
  hint,
  inputClassName,
  label,
  ...props
}: CheckboxFieldProps) {
  return (
    <div className="space-y-1">
      <label
        className={cn(
          "flex min-h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-foreground",
          className
        )}
        {...props}
      >
        <span className={cn("shrink-0", inputClassName)}>{children}</span>
        <span>{label}</span>
      </label>
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
