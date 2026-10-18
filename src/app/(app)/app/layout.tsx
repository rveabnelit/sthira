import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { requireUser } from "@/lib/auth/guard";
import { getSubscription } from "@/lib/data/subscriptions";
import { unreadNotificationCount } from "@/lib/data/notifications";
import { isAccessActive, subscriptionStatusLabel, subscriptionTone } from "@/lib/access";
import { AppShell } from "@/components/app/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/app");
  const subscription = getSubscription(user.id);
  const unread = unreadNotificationCount(user.id);

  return (
    <AppShell
      user={user}
      planName={subscription?.planName ?? "Нет подписки"}
      subscriptionLabel={subscriptionStatusLabel(subscription)}
      subscriptionTone={subscription ? subscriptionTone(subscription.status) : "neutral"}
      unreadCount={unread}
    >
      {!user.emailVerifiedAt ? (
        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-[#dccdb4] bg-[#f7f1e4] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-[#6b5b42]">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            Email не подтверждён. Подтвердите адрес, чтобы не потерять доступ к восстановлению пароля.
          </p>
          <Link
            href="/app/settings"
            className="shrink-0 text-[12px] font-medium text-[#5a4a32] underline underline-offset-4"
          >
            Подтвердить
          </Link>
        </div>
      ) : null}
      {subscription && !isAccessActive(subscription) ? (
        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-line bg-paper px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12.5px] leading-relaxed text-[#5c5f56]">
            Подписка неактивна. Профиль, настройки и история платежей остаются доступны.
          </p>
          <Link href="/pricing" className="shrink-0 text-[12px] font-medium text-forest underline underline-offset-4">
            Восстановить доступ
          </Link>
        </div>
      ) : null}
      {children}
    </AppShell>
  );
}
