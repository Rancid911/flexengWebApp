"use client";

import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
};

const dropdownMenus = [
  {
    id: "about",
    label: "О школе",
    links: [
      { label: "Наша методика", href: "/about", description: "Как выстраиваем программу под цель ученика" },
      { label: "Преподаватели", href: "/about", description: "Кто ведет занятия и как проходит отбор" },
      { label: "Результаты учеников", href: "/about", description: "Отзывы и реальные кейсы прогресса" }
    ]
  },
  {
    id: "resources",
    label: "Ресурсы",
    links: [
      { label: "Блог", href: "/articles", description: "Материалы по английскому и обучению" },
      { label: "FAQ", href: "/faq", description: "Ответы на частые вопросы перед стартом" },
      { label: "Поддержка", href: "/support", description: "Помощь и связь с командой Флексенг" }
    ]
  }
] as const;

export function MainHeader({ navItems }: { navItems: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [openMobileSections, setOpenMobileSections] = useState<Record<string, boolean>>({});
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  function handleDropdownOpen(id: string) {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setOpenDropdownId(id);
  }

  function handleDropdownClose() {
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdownId(null);
    }, 140);
  }

  function closeMobileMenu() {
    setOpen(false);
    setOpenMobileSections({});
  }

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobileMenu();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 bg-white/80 shadow-sm backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-2xl font-bold tracking-tight text-[#322F55] sm:text-[30px]">
          Флексенг
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="text-base font-medium text-[#706E88] transition-colors hover:text-[#322F55]">
              {item.label}
            </a>
          ))}
          {dropdownMenus.map((menu) => (
            <div
              key={menu.id}
              className="relative"
              onMouseEnter={() => handleDropdownOpen(menu.id)}
              onMouseLeave={handleDropdownClose}
              onFocusCapture={() => handleDropdownOpen(menu.id)}
              onBlurCapture={handleDropdownClose}
            >
              <button
                type="button"
                className="inline-flex items-center gap-1 text-base font-medium text-[#706E88] transition-colors hover:text-[#322F55]"
                aria-expanded={openDropdownId === menu.id}
                aria-haspopup="menu"
              >
                {menu.label}
                <ChevronDown className="h-4 w-4" />
              </button>

              {openDropdownId === menu.id ? (
                <div className="absolute left-1/2 top-[calc(100%+10px)] z-50 w-[340px] -translate-x-1/2 rounded-2xl border border-[#E4E1EF] bg-white p-3 shadow-[0_16px_36px_rgba(34,28,62,0.14)]">
                  <div className="grid gap-1">
                    {menu.links.map((link) => (
                      <a key={link.label} href={link.href} className="rounded-xl px-3 py-2 transition-colors hover:bg-[#F4F5F7]">
                        <p className="text-sm font-semibold text-[#322F55]">{link.label}</p>
                        <p className="text-xs text-[#6F6A86]">{link.description}</p>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </nav>

        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "hidden rounded-xl border-[#8D70FF] bg-[#8D70FF] text-white hover:bg-[#6F58CF] hover:text-white md:inline-flex"
          )}
        >
          Войти
        </Link>

        <button
          type="button"
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
          onClick={() => {
            if (open) {
              closeMobileMenu();
            } else {
              setOpen(true);
            }
          }}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D6D5DD] bg-white text-[#322F55] md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="md:hidden">
          <button className="fixed inset-0 z-30 bg-[rgba(21,18,35,0.45)] backdrop-blur-sm" onClick={closeMobileMenu} aria-label="Закрыть меню" />
          <div className="absolute inset-x-4 top-[calc(100%+8px)] z-40 rounded-2xl border border-[#DCD6EB] bg-[linear-gradient(160deg,#F5F1FF_0%,#FFFFFF_75%)] p-4 shadow-[0_20px_45px_rgba(46,33,89,0.2)]">
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={closeMobileMenu}
                aria-label="Закрыть меню"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#5E5783] transition-colors hover:text-[#322F55]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className="block rounded-xl px-3 py-2 text-base font-medium text-[#4A4476] transition-colors hover:bg-[#EEE8FF]"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-3 space-y-3 border-t border-[#E6E0F2] pt-3">
              {dropdownMenus.map((menu) => (
                <div key={menu.id} className="space-y-1">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[#6D6590] transition-colors hover:bg-[#EEE8FF]"
                    onClick={() => setOpenMobileSections((prev) => ({ ...prev, [menu.id]: !prev[menu.id] }))}
                    aria-expanded={Boolean(openMobileSections[menu.id])}
                    aria-controls={`mobile-menu-section-${menu.id}`}
                  >
                    {menu.label}
                    <ChevronDown
                      className={cn("h-4 w-4 transition-transform duration-200", openMobileSections[menu.id] ? "rotate-180" : "rotate-0")}
                    />
                  </button>
                  {openMobileSections[menu.id] ? (
                    <div id={`mobile-menu-section-${menu.id}`} className="ml-3 space-y-1 pl-2">
                      {menu.links.map((link) => (
                        <a
                          key={link.label}
                          href={link.href}
                          onClick={closeMobileMenu}
                          className="block rounded-xl px-3 py-2 text-sm text-[#4A4476] transition-colors hover:bg-[#EEE8FF]"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-2">
              <Link
                href="/dashboard"
                onClick={closeMobileMenu}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10 rounded-xl border-[#8D70FF] bg-[#8D70FF] text-white hover:bg-[#6F58CF] hover:text-white"
                )}
              >
                Войти
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
