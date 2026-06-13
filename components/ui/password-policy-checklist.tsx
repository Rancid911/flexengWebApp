"use client";

import { getPasswordPolicyChecklist } from "@/lib/auth/password-policy";
import { cn } from "@/lib/utils";

type PasswordPolicyChecklistProps = {
  password: string;
  className?: string;
};

export function PasswordPolicyChecklist({ password, className }: PasswordPolicyChecklistProps) {
  const rules = getPasswordPolicyChecklist(password);

  return (
    <ul className={cn("space-y-1 text-xs", className)} aria-label="Требования к паролю">
      {rules.map((rule) => (
        <li key={rule.id} className={cn("flex items-center gap-2", rule.valid ? "text-emerald-600" : "text-slate-500")}>
          <span aria-hidden="true">{rule.valid ? "✓" : "•"}</span>
          <span>{rule.label}</span>
        </li>
      ))}
    </ul>
  );
}
