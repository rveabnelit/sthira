import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guard";
import { getSubscription } from "@/lib/data/subscriptions";
import { listUpcomingSessions } from "@/lib/data/live";
import { canAccessPlan } from "@/lib/access";
import { ScheduleView } from "./schedule-view";

export const metadata: Metadata = {
  title: "Расписание",
  robots: { index: false, follow: false },
};

export default async function SchedulePage() {
  const user = await requireUser("/app/schedule");
  const subscription = getSubscription(user.id);
  const sessions = listUpcomingSessions(user.id);
  const hasLive = canAccessPlan(subscription, "live");

  return (
    <div>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">STHIRA Live</p>
          <h1 className="display-2 mt-2 text-[clamp(1.9rem,1.5rem+1.6vw,2.6rem)]">Расписание</h1>
          <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-muted">
            Групповые онлайн-занятия с Марией. Время указано по Москве — проверьте свой часовой пояс в настройках
            профиля.
          </p>
        </div>
        <span className={`badge ${hasLive ? "badge-success" : "badge-sand"} h-fit`}>
          {hasLive ? "Тариф Live активен" : "Доступно на тарифе Live"}
        </span>
      </header>

      <ScheduleView sessions={sessions} hasLive={hasLive} />
    </div>
  );
}
