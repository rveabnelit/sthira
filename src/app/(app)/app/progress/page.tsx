import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarCheck, Clock, Flame, Trophy } from "lucide-react";
import { requireUser } from "@/lib/auth/guard";
import { getProgressStats, listCompletions } from "@/lib/data/progress";
import { listUserPrograms } from "@/lib/data/programs";
import { getSubscription } from "@/lib/data/subscriptions";
import { canAccessPlan } from "@/lib/access";
import { formatDate, formatMinutes, plural } from "@/lib/format";
import { ActivityCalendar, WeeklyBars } from "@/components/app/activity";
import { PracticeCover } from "@/components/covers/practice-cover";
import { Badge, Eyebrow, EmptyState, Progress, Stat } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import type { CoverTone } from "@/content/catalog";

export const metadata: Metadata = {
  title: "Мой прогресс",
  robots: { index: false, follow: false },
};

export default async function ProgressPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period = "all" } = await searchParams;
  const user = await requireUser("/app/progress");
  const stats = getProgressStats(user.id);
  const subscription = getSubscription(user.id);
  const all = listCompletions(user.id, 60);
  const programs = listUserPrograms(user.id, canAccessPlan(subscription, "practice"));

  const cutoff =
    period === "week"
      ? Date.now() - 7 * 24 * 60 * 60 * 1000
      : period === "month"
        ? Date.now() - 30 * 24 * 60 * 60 * 1000
        : 0;
  const history = all.items.filter((item) => new Date(item.completedAt).getTime() >= cutoff);
  const historyMinutes = Math.round(history.reduce((acc, item) => acc + (item.durationSeconds ?? 0), 0) / 60);

  const periods = [
    { value: "week", label: "Неделя" },
    { value: "month", label: "Месяц" },
    { value: "all", label: "Всё время" },
  ];

  return (
    <div>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow>Регулярность</Eyebrow>
          <h1 className="display-2 mt-2 text-[clamp(1.9rem,1.5rem+1.6vw,2.6rem)]">Мой прогресс</h1>
          <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-muted">
            Здесь нет сравнений и штрафов за пропуски. Только ваша практика — чтобы замечать ритм и поддерживать
            привычку.
          </p>
        </div>
        <div className="flex rounded-xl border border-line bg-paper p-1">
          {periods.map((item) => (
            <Link
              key={item.value}
              href={`/app/progress?period=${item.value}`}
              className={`rounded-lg px-3 py-1.5 text-[12px] transition-colors ${
                period === item.value ? "bg-forest text-ivory" : "text-[#565950] hover:text-forest"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Завершено практик" value={stats.totalCompletions} hint={`${stats.activeDays} активных дней`} />
        <Stat
          label="Время практики"
          value={`${Math.floor(stats.totalMinutes / 60)} ч ${stats.totalMinutes % 60} м`}
          hint={`${historyMinutes} мин за выбранный период`}
        />
        <Stat label="Серия" value={`${stats.currentStreak}`} hint="дней подряд" />
        <Stat label="За неделю" value={`${stats.weekCount}`} hint={`${stats.weekMinutes} минут`} tone="forest" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="surface p-5">
          <div className="flex items-center justify-between">
            <Eyebrow>Календарь активности</Eyebrow>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
              <CalendarCheck className="h-3.5 w-3.5" />
              {stats.weekCount} за 7 дней
            </span>
          </div>
          <div className="mt-5">
            <ActivityCalendar days={stats.calendar} />
          </div>
        </section>

        <section className="surface p-5">
          <Eyebrow>Практика по неделям</Eyebrow>
          <div className="mt-4">
            <WeeklyBars weeks={stats.weeks} />
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="surface p-5">
          <div className="flex items-center justify-between">
            <Eyebrow>История занятий</Eyebrow>
            <span className="text-[11px] text-muted">
              {history.length} {plural(history.length, ["запись", "записи", "записей"])}
            </span>
          </div>

          {history.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="Пока пусто"
                description="Завершите первую практику — и здесь появится история занятий."
                action={
                  <Link href="/app/practice" className={buttonClass("primary", "sm")}>
                    Выбрать практику
                  </Link>
                }
              />
            </div>
          ) : (
            <ul className="mt-2">
              {history.slice(0, 12).map((item) => (
                <li key={item.id} className="border-b border-line last:border-0">
                  <Link
                    href={`/app/practice/${item.practiceId}`}
                    className="group flex items-center gap-3.5 py-3"
                  >
                    <span className="relative aspect-square w-11 shrink-0 overflow-hidden rounded-lg">
                      <PracticeCover tone={item.tone as CoverTone} variant={item.practiceTitle.length} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink group-hover:text-forest">
                        {item.practiceTitle}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted">
                        <Clock className="h-3 w-3" />
                        {formatMinutes(Math.round((item.durationSeconds ?? 0) / 60))}
                        {item.mood ? <span>· {item.mood}</span> : null}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] text-muted">
                      {formatDate(item.completedAt, { day: "numeric", month: "short" })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface p-5">
          <div className="flex items-center justify-between">
            <Eyebrow>Программы</Eyebrow>
            <Link href="/app/programs" className="text-[11px] text-muted hover:text-forest">
              Все
            </Link>
          </div>
          <div className="mt-4 space-y-4">
            {programs.slice(0, 4).map((item) => (
              <div key={item.program.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <Link
                    href={`/app/programs/${item.program.id}`}
                    className="truncate text-[12.5px] font-medium text-ink hover:text-forest"
                  >
                    {item.program.title}
                  </Link>
                  <span className="shrink-0 text-[11px] text-muted">{item.percent}%</span>
                </div>
                <Progress value={item.percent} className="mt-2" />
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-line bg-[#f7f3ea] p-4">
            <p className="flex items-center gap-2 text-[11.5px] font-medium text-ink">
              <Flame className="h-3.5 w-3.5 text-[#8a7251]" />
              Спокойный ориентир
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
              Две-три практики в неделю — уже устойчивый ритм. Если неделя пропущена, начните с короткой практики
              на 10 минут.
            </p>
          </div>
        </section>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-line bg-paper p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-sage-soft text-forest">
            <Trophy className="h-4 w-4" />
          </span>
          <p className="text-[12.5px] leading-relaxed text-[#4d5048]">
            Практика — это не соревнование. Мы не показываем рейтинги и не сравниваем учеников.
          </p>
        </div>
        <Link href="/app/practice" className={buttonClass("secondary", "sm")}>
          К практике
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <p className="mt-4 text-[10.5px] leading-relaxed text-muted">
        Метрики рассчитаны по сохранённым событиям занятий на сервере. <Badge>UTC+3</Badge> Часовой пояс:
        Europe/Moscow.
      </p>
    </div>
  );
}
