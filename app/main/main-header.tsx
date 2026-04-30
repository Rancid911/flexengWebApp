"use client";

import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll";
import { useOnClickOutside } from "@/hooks/use-on-click-outside";
import { cn } from "@/lib/utils";
import { siteDropdownMenus, type SiteNavItem } from "./site-navigation";

const MOBILE_MENU_ANIMATION_MS = 200;

export function MainHeader({ navItems }: { navItems: SiteNavItem[] }) {
  const [open, setOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [openMobileSections, setOpenMobileSections] = useState<Record<string, boolean>>({});
  const desktopNavRef = useRef<HTMLElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  useLockBodyScroll(open);

  const openMobileMenu = useCallback(() => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    setOpen(true);
  }, []);

  const closeMobileMenu = useCallback(() => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
    }

    setMenuVisible(false);
    closeTimeoutRef.current = window.setTimeout(() => {
      closeTimeoutRef.current = null;
      setOpen(false);
      setOpenMobileSections({});
    }, MOBILE_MENU_ANIMATION_MS);
  }, []);

  useEffect(() => {
    if (!open) return;

    const frameId = window.requestAnimationFrame(() => {
      setMenuVisible(true);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [open]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

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
  }, [closeMobileMenu, open]);

  useOnClickOutside(desktopNavRef, Boolean(openDropdownId), () => {
    setOpenDropdownId(null);
  });

  useEffect(() => {
    if (!openDropdownId) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openDropdownId]);

  return (
    <header className="sticky top-0 z-40 bg-white/80 shadow-sm backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="rounded-lg text-2xl font-bold tracking-tight text-[#322F55] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8D70FF] focus-visible:ring-offset-2 sm:text-[30px]"
        >
          Флексенг
        </Link>

        <nav ref={desktopNavRef} className="hidden items-center gap-5 md:flex" aria-label="Основная навигация сайта">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-1.5 py-1 text-base font-medium text-[#706E88] transition-[color,background-color,box-shadow] hover:text-[#322F55] focus:outline-none focus-visible:bg-[#f7f3ff] focus-visible:ring-2 focus-visible:ring-[#8D70FF] focus-visible:ring-offset-2"
            >
              {item.label}
            </Link>
          ))}
          {siteDropdownMenus.map((menu) => (
            <div
              key={menu.id}
              className="relative"
            >
              <button
                type="button"
                id={`site-nav-trigger-${menu.id}`}
                className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-base font-medium text-[#706E88] transition-[color,background-color,box-shadow] hover:text-[#322F55] focus:outline-none focus-visible:bg-[#f7f3ff] focus-visible:ring-2 focus-visible:ring-[#8D70FF] focus-visible:ring-offset-2"
                aria-expanded={openDropdownId === menu.id ? "true" : "false"}
                aria-controls={`site-nav-panel-${menu.id}`}
                onClick={() => setOpenDropdownId((current) => (current === menu.id ? null : menu.id))}
              >
                {menu.label}
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </button>

              {openDropdownId === menu.id ? (
                <div
                  id={`site-nav-panel-${menu.id}`}
                  aria-labelledby={`site-nav-trigger-${menu.id}`}
                  className="absolute left-1/2 top-[calc(100%+10px)] z-50 w-[340px] -translate-x-1/2 rounded-2xl border border-[#E4E1EF] bg-white p-3 shadow-[0_16px_36px_rgba(34,28,62,0.14)]"
                >
                  <div className="grid gap-1">
                    {menu.links.map((link) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        onClick={() => setOpenDropdownId(null)}
                        className="rounded-xl px-3 py-2 transition-[color,background-color,box-shadow] hover:bg-[#F4F5F7] focus:outline-none focus-visible:bg-[#f7f3ff] focus-visible:ring-2 focus-visible:ring-[#8D70FF] focus-visible:ring-inset"
                      >
                        <p className="text-sm font-semibold text-[#322F55]">{link.label}</p>
                        <p className="text-xs text-[#6F6A86]">{link.description}</p>
                      </Link>
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
            "hidden rounded-xl border-[#8D70FF] bg-[#8D70FF] text-white hover:bg-[#6F58CF] hover:text-white focus-visible:ring-[#8D70FF] focus-visible:ring-offset-2 md:inline-flex"
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
              openMobileMenu();
            }
          }}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D6D5DD] bg-white text-[#322F55] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8D70FF] focus-visible:ring-offset-2 md:hidden"
        >
          {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            data-testid="site-mobile-menu-backdrop"
            className={cn(
              "absolute inset-0 bg-[rgba(21,18,35,0.45)] backdrop-blur-sm transition-opacity duration-200 ease-out motion-reduce:duration-75",
              menuVisible ? "opacity-100" : "pointer-events-none opacity-0"
            )}
            onClick={closeMobileMenu}
            aria-label="Закрыть меню"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-site-menu-title"
            data-state={menuVisible ? "open" : "closed"}
            className={cn(
              "absolute inset-x-0 top-0 z-10 flex max-h-[calc(100dvh-0.75rem)] origin-top flex-col overflow-hidden rounded-b-2xl border-b border-[#DCD6EB] bg-[linear-gradient(160deg,#F5F1FF_0%,#FFFFFF_75%)] px-4 pb-4 pt-4 shadow-[0_20px_45px_rgba(46,33,89,0.22)]",
              "motion-safe:transition-[opacity,transform,clip-path] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-opacity motion-reduce:duration-75",
              menuVisible
                ? "translate-y-0 opacity-100 [clip-path:inset(0_0_0_0_round_0_0_1rem_1rem)]"
                : "pointer-events-none -translate-y-2 opacity-0 [clip-path:inset(0_0_100%_0_round_0_0_1rem_1rem)]"
            )}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p id="mobile-site-menu-title" className="truncate text-lg font-bold text-[#322F55]">
                  Меню сайта
                </p>
                <p className="text-sm text-[#706E88]">Флексенг</p>
              </div>
              <button
                type="button"
                onClick={closeMobileMenu}
                aria-label="Закрыть меню"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D6D5DD] bg-white text-[#5E5783] transition-[color,background-color,box-shadow] hover:bg-[#EEE8FF] hover:text-[#322F55] focus:outline-none focus-visible:bg-[#EEE8FF] focus-visible:ring-2 focus-visible:ring-[#8D70FF] focus-visible:ring-offset-2"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 overflow-y-auto overscroll-contain">
              <nav className="space-y-1" aria-label="Мобильная навигация сайта">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className="block rounded-xl px-3 py-2.5 text-base font-medium text-[#4A4476] transition-[color,background-color,box-shadow] hover:bg-[#EEE8FF] focus:outline-none focus-visible:bg-[#EEE8FF] focus-visible:ring-2 focus-visible:ring-[#8D70FF] focus-visible:ring-inset"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-3 space-y-3 border-t border-[#E6E0F2] pt-3">
                {siteDropdownMenus.map((menu) => (
                  <div key={menu.id} className="space-y-1">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[#6D6590] transition-[color,background-color,box-shadow] hover:bg-[#EEE8FF] focus:outline-none focus-visible:bg-[#EEE8FF] focus-visible:ring-2 focus-visible:ring-[#8D70FF] focus-visible:ring-inset"
                      onClick={() => setOpenMobileSections((prev) => ({ ...prev, [menu.id]: !prev[menu.id] }))}
                      aria-expanded={Boolean(openMobileSections[menu.id])}
                      aria-controls={`mobile-menu-section-${menu.id}`}
                    >
                      {menu.label}
                      <ChevronDown
                        aria-hidden="true"
                        className={cn("h-4 w-4 transition-transform duration-200", openMobileSections[menu.id] ? "rotate-180" : "rotate-0")}
                      />
                    </button>
                    {openMobileSections[menu.id] ? (
                      <div id={`mobile-menu-section-${menu.id}`} className="ml-3 space-y-1 pl-2">
                        {menu.links.map((link) => (
                          <Link
                            key={link.label}
                            href={link.href}
                            onClick={closeMobileMenu}
                            className="block rounded-xl px-3 py-2 text-sm text-[#4A4476] transition-[color,background-color,box-shadow] hover:bg-[#EEE8FF] focus:outline-none focus-visible:bg-[#EEE8FF] focus-visible:ring-2 focus-visible:ring-[#8D70FF] focus-visible:ring-inset"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-2 border-t border-[#E6E0F2] pt-4">
              <Link
                href="/dashboard"
                onClick={closeMobileMenu}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10 rounded-xl border-[#8D70FF] bg-[#8D70FF] text-white hover:bg-[#6F58CF] hover:text-white focus-visible:ring-[#8D70FF] focus-visible:ring-offset-2"
                )}
              >
                Войти
              </Link>
            </div>
          </aside>
        </div>
      ) : null}
    </header>
  );
}
