import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, CreditCard, ListTree, Users } from "lucide-react";
import { adminOverview, defaultPeriod } from "@/lib/data/admin";
import { formatDate, formatPrice, plural } from "@/lib/format";
import { AreaChart, DonutStat, MiniBars } from "@/components/admin/charts";
import { Badge, Stat } from "@/components/ui/primitives";
import { listUpcomingSessions } from "@/lib/data/live";

export const metadata: Metadata = {
  title: "Обзор",
  robots: { index: false, follow: false },
};

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days } = await searchParams;
  const periodDays = days === "7" ? 7 : days === "90" ? 90 : 30;
  const period = defaultPeriod(periodDays);
  const data = adminOverview(period);
  const live = listUpcomingSessions(null).slice(0, 3);
  const registrationSeries = await getRegistrationSeries(periodDays);

  const funnel = [
    { label: "Регистрации", value: data.newUsers },
    { label: "Активные подписки", value: data.activeSubs },
    { label: "Оплаченные платежи", value: data.paymentsCount },
    { label: "Завершённые занятия", value: data.completions },
  ];

  return (
    <div>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10.5px] uppercase tracking-[0.18em] text-muted">STHIRA · обзор</p>
          <h1 className="display-2 mt-2 text-[clamp(1.8rem,1.5rem+1.4vw,2.4rem)]">Панель управления</h1>
          <p className="mt-1.5 text-[12.5px] text-muted">
            Показатели за {periodDays} дней · данные демонстрационные
          </p>
        </div>
        <div className="flex rounded-lg border border-line bg-paper p-1">
          {[7, 30, 90].map((value) => (
            <Link
              key={value}
              href={`/admin?days=${value}`}
              className={`rounded-md px-3 py-1.5 text-[11.5px] transition-colors ${
                periodDays === value ? "bg-forest text-ivory" : "text-[#565950] hover:text-forest"
              }`}
            >
              {value} дней
            </Link>
          ))}
        </div>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Выручка" value={formatPrice(data.revenue)} hint={`${data.paymentsCount} подтверждённых платежей`} tone="forest" />
        <Stat label="Активные подписки" value={data.activeSubs} hint={`${data.newUsers} новых учеников`} />
        <Stat label="Ученики" value={data.totalUsers} hint={`${data.activePractitioners} практиковали за период`} />
        <Stat label="Завершено занятий" value={data.completions} hint="по сохранённым событиям" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="surface p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Регистрации</p>
              <p className="mt-1 font-serif text-[1.6rem]">{data.newUsers}</p>
            </div>
            <Badge>за {periodDays} дней</Badge>
          </div>
          <AreaChart className="mt-4" data={registrationSeries} />
        </section>

        <section className="surface p-5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Структура периода</p>
          <div className="mt-4">
            <MiniBars data={funnel} />
          </div>
          <p className="mt-4 text-[10.5px] leading-relaxed text-muted">
            Выручка считается только по подтверждённым платежам. Созданные заказы и ожидающие оплаты сюда не
            входят.
          </p>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="surface p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Последние регистрации</p>
            <Link href="/admin/students" className="text-[11px] text-muted hover:text-forest">
              Все ученики
            </Link>
          </div>
          <div className="mt-3 overflow-hidden rounded-lg border border-line">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-line bg-[#f7f3ea] text-left text-[10px] uppercase tracking-[0.1em] text-muted">
                  <th className="px-3 py-2 font-medium">Ученик</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Дата</th>
                </tr>
              </thead>
              <tbody>
                {data.recentUsers.map((user) => (
                  <tr key={user.id} className="border-b border-line last:border-0">
                    <td className="px-3 py-2">
                      <Link href={`/admin/students/${user.id}`} className="font-medium text-ink hover:text-forest">
                        {user.display_name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-muted">{user.email}</td>
                    <td className="px-3 py-2 text-muted">{formatDate(user.created_at, { day: "numeric", month: "short" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Последние события</p>
            <ul className="mt-2 space-y-1.5">
              {data.recentEvents.map((event, index) => (
                <li key={index} className="flex items-center justify-between gap-3 text-[11.5px]">
                  <span className="text-[#4d5048]">
                    {event.name}
                    {event.display_name ? ` · ${event.display_name}` : ""}
                  </span>
                  <span className="text-muted">{formatDate(event.created_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="space-y-4">
          <section className="surface p-5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Требует внимания</p>
            <ul className="mt-3 space-y-2 text-[12px]">
              <AttentionRow href="/admin/practices?status=draft" icon={BookOpen} label="Черновики практик" value={data.draftPractices} />
              <AttentionRow href="/admin/programs" icon={ListTree} label="Программы не опубликованы" value={data.draftPrograms} />
              <AttentionRow href="/admin/guide" icon={BookOpen} label="Материалы Guide не опубликованы" value={data.draftDocs} />
              <AttentionRow href="/admin/messages" icon={Users} label="Новые обращения" value={data.newMessages} />
              <AttentionRow href="/admin/billing?status=failed" icon={CreditCard} label="Платежи с ошибкой" value={data.pendingPayments} />
            </ul>
          </section>

          <section className="surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Ближайшие эфиры</p>
              <Link href="/admin/schedule" className="text-[11px] text-muted hover:text-forest">
                Расписание
              </Link>
            </div>
            <ul className="mt-3 space-y-3">
              {live.map((session) => (
                <li key={session.id}>
                  <p className="text-[12px] font-medium leading-snug">{session.title}</p>
                  <p className="mt-0.5 text-[10.5px] text-muted">
                    {formatDate(session.startsAt, { weekday: "short", day: "numeric", month: "long" })} ·{" "}
                    {new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow" }).format(new Date(session.startsAt))} МСК
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="surface p-5">
            <DonutStat
              value={data.paymentsCount}
              max={Math.max(1, data.paymentsCount + data.pendingPayments)}
              label="Подтверждённые платежи"
              sublabel={`${data.pendingPayments} ${plural(data.pendingPayments, ["платёж", "платежа", "платежей"])} с ошибкой или ожиданием`}
            />
          </section>
        </div>
      </div>

      <p className="mt-5 text-[10.5px] leading-relaxed text-muted">
        Демонстрационные данные созданы при первичном наполнении базы. Для боевого запуска отключите seed
        (SEED_DEMO_DATA=false) и работайте с реальными платежами провайдера.
      </p>
    </div>
  );
}

function AttentionRow({
  href,
  icon: Icon,
  label,
  value,
}: {
  href: string;
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-2 rounded-md py-0.5 text-[#4d5048] transition-colors hover:text-forest">
        <Icon className="h-3.5 w-3.5 text-muted" />
        <span className="flex-1">{label}</span>
        <span className={value > 0 ? "font-medium text-[#8a3d2f]" : "text-muted"}>{value}</span>
        <ArrowUpRight className="h-3 w-3 text-muted" />
      </Link>
    </li>
  );
}

async function getRegistrationSeries(days: number) {
  const { all } = await import("@/lib/db");
  const rows = all<{ day: string; value: number }>(
    "SELECT substr(created_at, 1, 10) AS day, count(*) AS value FROM users WHERE role = 'student' AND created_at >= ? GROUP BY day ORDER BY day",
    new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
  );
  const map = new Map(rows.map((row) => [row.day, Number(row.value)]));
  return getEmptySeries(days).map((item) => ({ ...item, value: map.get(item.day) ?? 0 }));
}

function getEmptySeries(days: number) {
  return Array.from({ length: Math.min(days, 90) }, (_, index) => {
    const date = new Date(Date.now() - (Math.min(days, 90) - 1 - index) * 24 * 60 * 60 * 1000);
    return { day: date.toISOString().slice(0, 10), value: 0 };
  });
}
