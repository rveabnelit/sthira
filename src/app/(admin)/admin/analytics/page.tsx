import type { Metadata } from "next";
import Link from "next/link";
import { adminAnalytics, defaultPeriod } from "@/lib/data/admin";
import { formatDate, formatPrice, plural } from "@/lib/format";
import { AreaChart, DonutStat, MiniBars } from "@/components/admin/charts";
import { AdminHeader } from "@/components/admin/page-header";
import { Stat } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Аналитика",
  robots: { index: false, follow: false },
};

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days } = await searchParams;
  const periodDays = days === "7" ? 7 : days === "90" ? 90 : 30;
  const period = defaultPeriod(periodDays);
  const data = adminAnalytics(period);

  const funnel = [
    { label: "Регистрации", value: data.funnel.signups },
    { label: "Онбординг завершён", value: data.funnel.onboardings },
    { label: "Первая практика", value: data.funnel.firstPractices },
    { label: "Оформление заказа", value: data.funnel.checkouts },
    { label: "Оплата подтверждена", value: data.funnel.paid },
  ];

  return (
    <div>
      <AdminHeader
        title="Аналитика"
        description="Показатели за период. Выручка считается только по подтверждённым платежам, конверсии — по событиям аналитики."
        action={
          <div className="flex rounded-lg border border-line bg-paper p-1">
            {[7, 30, 90].map((value) => (
              <Link
                key={value}
                href={`/admin/analytics?days=${value}`}
                className={`rounded-md px-3 py-1.5 text-[11.5px] transition-colors ${
                  periodDays === value ? "bg-forest text-ivory" : "text-[#565950] hover:text-forest"
                }`}
              >
                {value} дней
              </Link>
            ))}
          </div>
        }
      />

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Регистрации" value={data.registrationsTotal} hint={`${formatDate(period.from, { day: "numeric", month: "short" })} — ${formatDate(period.to, { day: "numeric", month: "short" })}`} />
        <Stat label="Выручка" value={formatPrice(data.revenueTotal)} hint={`${data.funnel.paid} подтверждённых оплат`} tone="forest" />
        <Stat label="Активные подписки" value={data.activeSubs} hint={`${data.newSubs} новых за период`} />
        <Stat label="Отмены" value={data.cancelled} hint="отмена автопродления" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="surface p-5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Регистрации по дням</p>
          <AreaChart className="mt-4" data={data.registrations} />
        </section>
        <section className="surface p-5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Подтверждённая выручка</p>
          <AreaChart className="mt-4" data={data.revenue} tone="sage" formatValue={(value) => formatPrice(value)} />
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="surface p-5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Воронка</p>
          <div className="mt-4">
            <MiniBars data={funnel} />
          </div>
          <div className="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
            <div>
              <p className="text-[10px] uppercase tracking-[0.1em] text-muted">Онбординг</p>
              <p className="mt-1 font-serif text-[1.3rem]">{data.funnel.onboardingRate ?? "—"}%</p>
              <p className="text-[10.5px] text-muted">от регистраций</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.1em] text-muted">Тарифы → оплата</p>
              <p className="mt-1 font-serif text-[1.3rem]">{data.funnel.pricingToPaid ?? "—"}%</p>
              <p className="text-[10.5px] text-muted">от просмотров тарифов</p>
            </div>
          </div>
          <p className="mt-4 text-[10px] leading-relaxed text-muted">
            Конверсии рассчитываются по событиям, записанным на сервере. Если событий не было, показатель не
            показывается — фиктивные значения не подставляются.
          </p>
        </section>

        <section className="surface p-5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Популярные практики</p>
          {data.popular.length ? (
            <div className="mt-4">
              <MiniBars data={data.popular.map((item) => ({ label: item.title, value: Number(item.count) }))} />
            </div>
          ) : (
            <p className="mt-3 text-[11.5px] text-muted">Пока нет завершений за период.</p>
          )}
          <div className="mt-4 border-t border-line pt-4">
            <DonutStat
              value={data.lessonCompletions}
              max={Math.max(1, data.lessonCompletions + data.funnel.firstPractices)}
              label="Завершения уроков программ"
              sublabel={`${data.lessonCompletions} ${plural(data.lessonCompletions, ["урок", "урока", "уроков"])} за период`}
            />
          </div>
        </section>
      </div>

      <section className="surface mt-4 p-5">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Программы</p>
        <div className="mt-4 space-y-3">
          {data.programCompletion.map((program) => {
            const percent = Number(program.total) ? Math.round((Number(program.completed) / Number(program.total)) * 100) : 0;
            return (
              <div key={program.program_id}>
                <div className="flex items-center justify-between gap-3 text-[11.5px]">
                  <span className="text-[#4d5048]">{program.title}</span>
                  <span className="text-muted">
                    {program.completed} из {program.total} уроков ·
                    <span className="ml-1">{percent}%</span>
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#eae6dc]">
                  <div className="h-full rounded-full bg-forest/70" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-[10px] leading-relaxed text-muted">
          «Завершения программ» считаются по уникальным завершённым урокам за выбранный период, а не по числу
          учеников, дошедших до конца. Это ограничение MVP.
        </p>
      </section>
    </div>
  );
}
