"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Compass,
  CreditCard,
  Heart,
  LayoutDashboard,
  LineChart,
  ListTree,
  MessageSquare,
  Settings,
  Sparkles,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";

const APP_NAV = [
  { href: "/app", label: "Главная", icon: LayoutDashboard, exact: true },
  { href: "/app/practice", label: "Практики", icon: BookOpen },
  { href: "/app/programs", label: "Мои программы", icon: Compass },
  { href: "/app/progress", label: "Мой прогресс", icon: TrendingUp },
  { href: "/app/schedule", label: "Расписание", icon: CalendarDays },
  { href: "/app/guide", label: "STHIRA Guide", icon: Sparkles },
  { href: "/app/favorites", label: "Избранное", icon: Heart },
];

const APP_BOTTOM = [
  { href: "/app", label: "Главная", icon: LayoutDashboard, exact: true },
  { href: "/app/practice", label: "Практики", icon: BookOpen },
  { href: "/app/programs", label: "Программы", icon: Compass },
  { href: "/app/progress", label: "Прогресс", icon: TrendingUp },
  { href: "/app/guide", label: "Guide", icon: Sparkles },
];

export function AppSidebarNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Навигация личного кабинета" className="flex flex-col gap-0.5 px-3">
      {APP_NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] transition-colors",
              active ? "bg-[#eae6db] font-medium text-forest" : "text-[#565950] hover:bg-[#f0ece3] hover:text-forest",
            )}
          >
            <item.icon className={cn("h-[18px] w-[18px]", active ? "text-forest" : "text-[#8a8c83]")} strokeWidth={1.6} />
            {item.label}
          </Link>
        );
      })}

      <div className="my-3 h-px bg-line" />

      <Link
        href="/app/settings"
        className={cn(
          "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] transition-colors",
          pathname.startsWith("/app/settings")
            ? "bg-[#eae6db] font-medium text-forest"
            : "text-[#565950] hover:bg-[#f0ece3] hover:text-forest",
        )}
      >
        <User className="h-[18px] w-[18px] text-[#8a8c83]" strokeWidth={1.6} />
        Профиль
      </Link>
      <Link
        href="/app/subscription"
        className={cn(
          "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] transition-colors",
          pathname.startsWith("/app/subscription")
            ? "bg-[#eae6db] font-medium text-forest"
            : "text-[#565950] hover:bg-[#f0ece3] hover:text-forest",
        )}
      >
        <CreditCard className="h-[18px] w-[18px] text-[#8a8c83]" strokeWidth={1.6} />
        Подписка
      </Link>
    </nav>
  );
}

export function AppBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Мобильная навигация"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ivory/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <div className="grid grid-cols-5">
        {APP_BOTTOM.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 px-1 py-2.5 text-[10px] transition-colors",
                active ? "text-forest" : "text-[#8a8c83]",
              )}
            >
              <item.icon className="h-[20px] w-[20px]" strokeWidth={active ? 2 : 1.6} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

const ADMIN_NAV = [
  { href: "/admin", label: "Обзор", icon: LayoutDashboard, exact: true },
  { href: "/admin/students", label: "Ученики", icon: Users },
  { href: "/admin/practices", label: "Практики", icon: BookOpen },
  { href: "/admin/programs", label: "Программы", icon: ListTree },
  { href: "/admin/schedule", label: "Расписание", icon: CalendarDays },
  { href: "/admin/billing", label: "Платежи", icon: CreditCard },
  { href: "/admin/guide", label: "AI-наставник", icon: Sparkles },
  { href: "/admin/analytics", label: "Аналитика", icon: LineChart },
  { href: "/admin/messages", label: "Обращения", icon: MessageSquare },
  { href: "/admin/settings", label: "Настройки", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Навигация администратора" className="flex flex-col gap-0.5 px-3">
      {ADMIN_NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors",
              active ? "bg-[#eae6db] font-medium text-forest" : "text-[#565950] hover:bg-[#f0ece3] hover:text-forest",
            )}
          >
            <item.icon className="h-[17px] w-[17px] text-[#8a8c83]" strokeWidth={1.6} />
            {item.label}
          </Link>
        );
      })}
      <Link
        href="/admin/analytics"
        className="mt-4 flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-[12px] text-muted transition-colors hover:border-forest/30 hover:text-forest"
      >
        <BarChart3 className="h-4 w-4" />
        Демо-данные
      </Link>
    </nav>
  );
}
