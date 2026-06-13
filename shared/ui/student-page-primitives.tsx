import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StudentPageHeader({
  title,
  description,
  actions
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
        <p className="max-w-3xl text-base text-slate-600">{description}</p>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </section>
  );
}

export function StudentSubnav({
  items
}: {
  items: Array<{
    href: string;
    label: string;
    active?: boolean;
  }>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
            item.active
              ? "border-indigo-200 bg-indigo-50 text-indigo-700"
              : "border-[#dde2e9] bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
          )}
          aria-current={item.active ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export function StudentEmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="rounded-[2rem] border-dashed border-[#d9e1ec] bg-[#f8fbff] shadow-none">
      <CardContent className="space-y-2 p-8 text-center">
        <p className="text-lg font-semibold text-slate-900">{title}</p>
        <p className="mx-auto max-w-2xl text-sm text-slate-600">{description}</p>
      </CardContent>
    </Card>
  );
}

export function StudentStatCard({
  label,
  value,
  hint
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="rounded-[1.8rem] border-[#dfe3ea] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
      <CardContent className="space-y-2 p-5">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-4xl font-black tracking-[-0.04em] text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{hint}</p>
      </CardContent>
    </Card>
  );
}
