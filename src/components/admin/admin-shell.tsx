import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AdminNav } from "@/components/app/app-nav";
import { Avatar } from "@/components/ui/primitives";
import type { SessionUser } from "@/lib/types";

export function AdminShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#f5f2ea]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-line bg-[#efece3] lg:flex">
        <div className="flex h-[72px] items-center px-5">
          <Logo />
        </div>
        <p className="px-6 pb-3 text-[10px] uppercase tracking-[0.2em] text-muted">Админ-панель</p>
        <div className="flex-1 overflow-y-auto pb-4">
          <AdminNav />
        </div>
        <div className="border-t border-line p-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] text-[#565950] transition-colors hover:bg-[#e8e4d9] hover:text-forest"
          >
            <ArrowUpRight className="h-4 w-4" />
            Открыть сайт
          </Link>
          <Link
            href="/app"
            className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] text-[#565950] transition-colors hover:bg-[#e8e4d9] hover:text-forest"
          >
            <ArrowUpRight className="h-4 w-4" />
            Личный кабинет
          </Link>
          <div className="mt-2 flex items-center gap-2.5 rounded-lg px-2 py-2">
            <Avatar name={user.displayName} size={30} />
            <span className="min-w-0">
              <span className="block truncate text-[12.5px] font-medium text-ink">{user.displayName}</span>
              <span className="block text-[10.5px] uppercase tracking-[0.1em] text-muted">Администратор</span>
            </span>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-[#f5f2ea]/95 px-4 backdrop-blur-md md:px-7">
          <div className="lg:hidden">
            <Logo compact />
          </div>
          <p className="hidden text-[12px] text-muted md:block">
            Управление платформой STHIRA · демонстрационный стенд
          </p>
          <div className="ml-auto flex items-center gap-2">
            <span className="badge badge-sand">DEMO</span>
            <Link
              href="/app"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[12.5px] text-[#4d5048] transition-colors hover:bg-paper"
            >
              Кабинет
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1240px] px-4 py-6 md:px-7 md:py-8">{children}</main>
      </div>
    </div>
  );
}
