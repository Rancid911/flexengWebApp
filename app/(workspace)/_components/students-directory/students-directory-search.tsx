"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

type StudentsDirectorySearchProps = {
  serverQuery: string;
  value: string;
  ariaLabel?: string;
  onValueChange: (value: string) => void;
};

const STUDENTS_DIRECTORY_SEARCH_DEBOUNCE_MS = 250;

export function StudentsDirectorySearch({ serverQuery, value, ariaLabel = "Поиск ученика", onValueChange }: StudentsDirectorySearchProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const lastNavigationQueryRef = useRef(serverQuery);
  const debouncedQuery = useDebouncedValue(value.trim(), STUDENTS_DIRECTORY_SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (debouncedQuery.length > 0 && debouncedQuery.length < 3) {
      return;
    }

    const nextUrl = debouncedQuery ? `${pathname}?q=${encodeURIComponent(debouncedQuery)}&page=1` : pathname;
    const currentUrl = serverQuery ? `${pathname}?q=${encodeURIComponent(serverQuery)}&page=1` : pathname;
    if (nextUrl === currentUrl || debouncedQuery === lastNavigationQueryRef.current) {
      return;
    }

    lastNavigationQueryRef.current = debouncedQuery;
    startTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });
  }, [debouncedQuery, pathname, router, serverQuery]);

  return (
    <div className="inline-flex max-w-full">
      <Input
        type="search"
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value);
        }}
        placeholder="Поиск по имени, email или телефону"
        autoComplete="off"
        spellCheck={false}
        className="h-11 w-full rounded-2xl bg-white sm:w-[360px]"
        aria-label={ariaLabel}
      />
    </div>
  );
}
