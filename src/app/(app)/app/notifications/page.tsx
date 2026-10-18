import type { Metadata } from "next";
import Link from "next/link";
import { Bell, CalendarDays, CreditCard, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth/guard";
import { listNotifications, unreadNotificationCount } from "@/lib/data/notifications";
import { formatDateTime } from "@/lib/format";
import { MarkAllRead } from "./mark-all-read";
import { EmptyState, Eyebrow } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Уведомления",
  robots: { index: false, follow: false },
};

const ICONS: Record<string, typeof Bell> = {
  live: CalendarDays,
  content: Sparkles,
  subscription: CreditCard,
  payment: CreditCard,
  system: Bell,
};

export default async function NotificationsPage() {
  const user = await requireUser("/app/notifications");
  const notifications = listNotifications(user.id);
  const unread = unreadNotificationCount(user.id);

  return (
    <div className="mx-auto max-w-3xl">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow>Сервисные сообщения</Eyebrow>
          <h1 className="display-2 mt-2 text-[clamp(1.9rem,1.5rem+1.6vw,2.6rem)]">Уведомления</h1>
          <p className="mt-1.5 text-[13.5px] text-muted">
            Напоминания о занятиях, изменения расписания и события подписки.
          </p>
        </div>
        {unread > 0 ? <MarkAllRead /> : null}
      </header>

      {notifications.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Bell className="h-5 w-5" />}
            title="Уведомлений пока нет"
            description="Здесь появятся напоминания о прямых эфирах, новые материалы и события подписки."
          />
        </div>
      ) : (
        <ul className="mt-6 overflow-hidden rounded-[16px] border border-line bg-paper">
          {notifications.map((notification) => {
            const Icon = ICONS[notification.type] ?? Bell;
            const unreadItem = !notification.readAt;
            const body = (
              <>
                <span
                  className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                    unreadItem ? "bg-sage-soft text-forest" : "bg-[#f1ede4] text-[#8a8c83]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={`text-[13px] ${unreadItem ? "font-medium text-ink" : "text-[#565950]"}`}>
                      {notification.title}
                    </span>
                    {unreadItem ? <span className="h-1.5 w-1.5 rounded-full bg-[#8a7251]" aria-label="Не прочитано" /> : null}
                  </span>
                  <span className="mt-1 block text-[12.5px] leading-relaxed text-muted">{notification.body}</span>
                  <span className="mt-1.5 block text-[10.5px] text-muted">{formatDateTime(notification.createdAt)}</span>
                </span>
              </>
            );

            return (
              <li key={notification.id} className="border-b border-line last:border-0">
                {notification.href ? (
                  <Link href={notification.href} className="flex gap-3.5 px-5 py-4 transition-colors hover:bg-[#faf7f0]">
                    {body}
                  </Link>
                ) : (
                  <div className="flex gap-3.5 px-5 py-4">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-muted">
        Каналы уведомлений настраиваются в{" "}
        <Link href="/app/settings" className="link-underline text-forest">
          профиле
        </Link>
        . Email-рассылки в MVP не подключены — уведомления показываются в кабинете.
      </p>
    </div>
  );
}
