import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AppBottomNav, AppSidebarNav } from "@/components/app/app-nav";
import { Avatar } from "@/components/ui/primitives";
import type { SessionUser } from "@/lib/types";
import { cn } from "@/lib/cn";

export function AppShell({
  user,
  planName,
  subscriptionLabel,
  subscriptionTone,
  unreadCount,
  children,
}: {
  user: SessionUser;
  planName: string;
  subscriptionLabel: string;
  subscriptionTone: "success" | "warning" | "danger" | "neutral";
  unreadCount: number;
  children: React.ReactNode;
}) {
  const toneDot = {
    success: "bg-[#4f6b52]",
    warning: "bg-[#b08a45]",
    danger: "bg-[#9b4a3a]",
    neutral: "bg-[#a5a79e]",
  }[subscriptionTone];

  return (
    <div className="min-h-dvh bg-ivory">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-forest focus:px-4 focus:py-2 focus:text-sm focus:text-ivory"
      >
        К содержанию
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-line bg-[#f7f4ed] lg:flex">
        <div className="flex h-[76px] items-center px-6">
          <Logo />
        </div>
        <div className="flex-1 overflow-y-auto pb-4">
          <AppSidebarNav />
        </div>
        <div className="border-t border-line p-3">
          <div className="rounded-xl border border-line bg-paper p-3.5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Подписка</p>
            <p className="mt-1 font-serif text-[1.05rem] text-ink">{planName}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-[#5f6259]">
              <span className={cn("h-1.5 w-1.5 rounded-full", toneDot)} />
              {subscriptionLabel}
            </p>
            <Link
              href="/app/subscription"
              className="mt-2.5 inline-flex text-[11.5px] font-medium text-forest underline-offset-4 hover:underline"
            >
              Управлять подпиской
            </Link>
          </div>
          <Link
            href="/app/settings"
            className="mt-2 flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-[#f0ece3]"
          >
            <Avatar name={user.displayName} size={32} />
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-ink">{user.displayName}</span>
              <span className="block truncate text-[11px] text-muted">{user.email}</span>
            </span>
          </Link>
        </div>
      </aside>

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-ivory/90 px-4 backdrop-blur-md md:px-8">
          <div className="lg:hidden">
            <Logo compact />
          </div>
          <form action="/app/practice" className="relative hidden max-w-sm flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              name="q"
              placeholder="Найти практику"
              aria-label="Поиск по практикам"
              className="input h-10 pl-9 text-[13px]"
            />
          </form>
          <div className="ml-auto flex items-center gap-1.5">
            <Link
              href="/app/notifications"
              aria-label={`Уведомления${unreadCount ? `, непрочитанных: ${unreadCount}` : ""}`}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#565950] transition-colors hover:bg-[#f0ece3] hover:text-forest"
            >
              <Bell className="h-[19px] w-[19px]" strokeWidth={1.6} />
              {unreadCount > 0 ? (
                <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-forest px-1 text-[9px] font-medium text-ivory">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </Link>
            <Link
              href="/app/settings"
              aria-label="Профиль и настройки"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[#f0ece3]"
            >
              <Avatar name={user.displayName} size={30} />
            </Link>
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-[1160px] px-4 pb-28 pt-6 md:px-8 md:pb-20 md:pt-8">
          {children}
        </main>
      </div>

      <AppBottomNav />
    </div>
  );
}
