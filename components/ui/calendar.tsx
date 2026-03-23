"use client";

import * as React from "react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayButton, DayPicker, DropdownProps, getDefaultClassNames } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  formatters,
  components,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      className={cn(
        "group/calendar rounded-md bg-white p-2 text-slate-900",
        className
      )}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          "inline-flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white p-0 text-slate-900 transition hover:border-[#4A4476] hover:bg-[#4A4476] hover:text-white aria-disabled:border-slate-200 aria-disabled:bg-slate-50 aria-disabled:text-slate-300 aria-disabled:opacity-100",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          "inline-flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white p-0 text-slate-900 transition hover:border-[#4A4476] hover:bg-[#4A4476] hover:text-white aria-disabled:border-slate-200 aria-disabled:bg-slate-50 aria-disabled:text-slate-300 aria-disabled:opacity-100",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-8 w-full items-center justify-center px-8",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-8 w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative rounded-md border border-slate-200 bg-white shadow-xs has-focus:border-violet-500 has-focus:ring-[3px] has-focus:ring-violet-500/20",
          defaultClassNames.dropdown_root
        ),
        dropdown:
          "absolute inset-0 cursor-pointer rounded-md opacity-0",
        caption_label: cn(
          "font-medium text-slate-900 select-none",
          captionLayout === "label"
            ? "text-sm"
            : "flex h-8 items-center gap-1 rounded-md pr-1 pl-2 text-sm [&>svg]:size-3.5 [&>svg]:text-slate-500",
          defaultClassNames.caption_label
        ),
        month_grid: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 rounded-md text-[0.8rem] font-normal text-slate-500 select-none",
          defaultClassNames.weekday
        ),
        weeks: cn("mt-2 space-y-1", defaultClassNames.weeks),
        week: cn("flex w-full", defaultClassNames.week),
        day: cn("relative aspect-square h-full w-full p-0 text-center text-sm select-none", defaultClassNames.day),
        day_button: cn("h-9 w-9 rounded-md border border-transparent bg-white p-0 font-normal text-slate-900 transition hover:border-[#4A4476] hover:bg-[#4A4476] hover:text-white aria-selected:border-[#4A4476] aria-selected:bg-[#4A4476] aria-selected:text-white aria-selected:hover:border-[#4A4476] aria-selected:hover:bg-[#4A4476] aria-selected:hover:text-white", defaultClassNames.day_button),
        selected: "bg-[#4A4476] text-white hover:bg-[#3f3966] hover:text-white",
        today: "bg-violet-100 text-violet-700",
        outside: "text-slate-400 opacity-70",
        disabled: "text-slate-300 opacity-60",
        chevron: "h-4 w-4 stroke-[2.25]",
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames
      }}
      components={{
        Chevron: ({ className: chevronClassName, orientation, ...chevronProps }) => {
          if (orientation === "left") {
            return <ChevronLeftIcon className={cn("size-4", chevronClassName)} {...chevronProps} />;
          }
          if (orientation === "right") {
            return <ChevronRightIcon className={cn("size-4", chevronClassName)} {...chevronProps} />;
          }
          return <ChevronDownIcon className={cn("size-4", chevronClassName)} {...chevronProps} />;
        },
        Dropdown: CalendarDropdown,
        DayButton: CalendarDayButton,
        ...components
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected={modifiers.selected}
        className={cn(
        "size-9 rounded-md border border-transparent bg-white p-0 font-normal text-slate-900 transition hover:border-[#4A4476] hover:bg-[#4A4476] hover:text-white data-[selected=true]:border-[#4A4476] data-[selected=true]:bg-[#4A4476] data-[selected=true]:text-white data-[selected=true]:hover:border-[#4A4476] data-[selected=true]:hover:bg-[#4A4476] data-[selected=true]:hover:text-white",
        className
      )}
      {...props}
    />
  );
}

function CalendarDropdown({
  value,
  onChange,
  options = [],
  disabled
}: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.value === Number(value));

  React.useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function handleSelect(nextValue: number) {
    if (!onChange) return;
    onChange({
      target: { value: String(nextValue) },
      currentTarget: { value: String(nextValue) }
    } as React.ChangeEvent<HTMLSelectElement>);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-sm font-medium text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        <span>{selected?.label ?? "—"}</span>
        <ChevronDownIcon className={cn("h-3.5 w-3.5 text-slate-900 transition", open && "rotate-180")} />
      </button>

      {open ? (
        <div className="absolute top-full left-0 z-50 mt-1 w-44 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
          <div className="max-h-48 overflow-y-auto pr-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm text-slate-800 transition hover:bg-slate-100",
                  option.value === Number(value) && "bg-[#322F55] text-white hover:bg-[#2a2747]",
                  option.disabled && "cursor-not-allowed opacity-50"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export { Calendar, CalendarDayButton };
