"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/practice", label: "Практики" },
  { href: "/programs", label: "Программы" },
  { href: "/#how-it-works", label: "Как это работает" },
  { href: "/about", label: "О Марии" },
  { href: "/pricing", label: "Тарифы" },
];

export function SiteHeader({ user }: { user: { displayName: string; role: string } | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ivory/85 backdrop-blur-md">
      <div className="container-app flex h-[68px] items-center justify-between gap-6">
        <Logo />

        <nav aria-label="Основная навигация" className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) => {
            const active = item.href.startsWith("/") && !item.href.includes("#") && pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-[13.5px] transition-colors hover:text-forest",
                  active ? "text-forest" : "text-[#565950]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <Link href={user.role === "admin" ? "/admin" : "/app"} className={buttonClass("secondary", "sm")}>
              Личный кабинет
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[13.5px] text-[#565950] transition-colors hover:text-forest"
              >
                Вход
              </Link>
              <Link href="/signup" className={buttonClass("primary", "sm")}>
                Начать практику
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-forest lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div id="mobile-menu" className="fixed inset-x-0 top-[68px] z-40 h-[calc(100dvh-68px)] overflow-y-auto bg-ivory px-5 pb-10 pt-6 lg:hidden">
          <nav aria-label="Мобильная навигация" className="flex flex-col">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border-b border-line py-4 font-serif text-2xl text-ink"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/faq" className="border-b border-line py-4 font-serif text-2xl text-ink">
              Вопросы
            </Link>
            <Link href="/contacts" className="border-b border-line py-4 font-serif text-2xl text-ink">
              Контакты
            </Link>
          </nav>
          <div className="mt-8 flex flex-col gap-3">
            {user ? (
              <Link href={user.role === "admin" ? "/admin" : "/app"} className={buttonClass("primary", "lg")}>
                Личный кабинет
              </Link>
            ) : (
              <>
                <Link href="/signup" className={buttonClass("primary", "lg")}>
                  Начать практику
                </Link>
                <Link href="/login" className={buttonClass("secondary", "lg")}>
                  Войти в аккаунт
                </Link>
              </>
            )}
          </div>
          <p className="mt-6 text-xs leading-relaxed text-muted">
            STHIRA — авторская школа хатха-йоги Марии Васильевой. Практика не заменяет медицинскую помощь.
          </p>
        </div>
      ) : null}
    </header>
  );
}
