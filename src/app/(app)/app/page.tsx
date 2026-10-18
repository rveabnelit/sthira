import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Flame,
  Lock,
  Play,
  Sparkles,
} from "lucide-react";
import { requireUser } from "@/lib/auth/guard";
import { getPreferences } from "@/lib/data/preferences";
import { getSubscription } from "@/lib/data/subscriptions";
import { getProgressStats, listCompletions } from "@/lib/data/progress";
import { listUserPrograms } from "@/lib/data/programs";
import { lastUnfinishedPractice } from "@/lib/data/player";
import { listUpcomingSessions } from "@/lib/data/live";
import { recommendPractices } from "@/lib/data/recommend";
import { canAccessPlan, isAccessActive } from "@/lib/access";
import { formatDate, formatMinutes, formatTime, goalShort, plural, relativeDays } from "@/lib/format";
import { PracticeCover } from "@/components/covers/practice-cover";
import { RecentRow } from "@/components/cards/cards";
import type { CoverTone } from "@/content/catalog";
import { Badge, Eyebrow, Progress } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";

function greeting() {
  const hour = new Date(Date.now() + 3 * 60 * 60 * 1000).getUTCHours();
  if (hour < 5) return "Доброй ночи";
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}

export default async function AppDashboard() {
  const user = await requireUser();
  const prefs = getPreferences(user.id);
  const subscription = getSubscription(user.id);
  const active = isAccessActive(subscription);
  const stats = getProgressStats(user.id);
  const recommendations = recommendPractices({ userId: user.id, subscription, prefs, limit: 3 });
  const today = recommendations[0]?.practice ?? null;
  const unfinished = lastUnfinishedPractice(user.id);
  const programs = listUserPrograms(user.id, canAccessPlan(subscription, "practice"));
  const currentProgram = programs.find((item) => item.started && !item.completed) ?? null;
  const recent = listCompletions(user.id, 4).items;
  const live = listUpcomingSessions(user.id)[0] ?? null;
  const onboardingDone = Boolean(prefs?.onboardingCompletedAt);

  const week = stats.calendar.slice(-7);
  const weekdayLabels = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
            {formatDate(new Date(), { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="display-2 mt-2 text-[clamp(1.9rem,1.5rem+1.6vw,2.6rem)]">
            {greeting()}, {user.displayName}
          </h1>
          <p className="mt-1.5 text-[13.5px] text-muted">
            {stats.currentStreak > 0
              ? `${stats.currentStreak} ${plural(stats.currentStreak, ["день", "дня", "дней"])} практики подряд — спокойный ритм.`
              : "Сегодня хороший день, чтобы вернуться к практике."}
          </p>
        </div>
        {!onboardingDone ? (
          <Link href="/app/onboarding" className={buttonClass("secondary", "sm")}>
            Настроить маршрут
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </header>

      {!onboardingDone ? (
        <div className="flex flex-col gap-4 rounded-[18px] border border-[#dccdb4] bg-[#f7f1e4] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <p className="eyebrow text-[#8a7251]">Первый шаг</p>
            <p className="mt-2 font-serif text-[1.35rem] leading-snug text-[#3f3527]">
              Ответьте на 4 вопроса — и мы соберём стартовый маршрут
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#6b5b42]">
              Цель, опыт, доступное время и удобный ритм. Это займёт меньше минуты.
            </p>
          </div>
          <Link
            href="/app/onboarding"
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-[10px] bg-forest px-4 text-[12.5px] font-medium text-ivory hover:bg-forest-deep"
          >
            Подобрать практику
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* Сегодняшняя практика */}
        <section className="surface flex flex-col self-start overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <div className="flex items-center justify-between">
              <Eyebrow>Твоя практика на сегодня</Eyebrow>
              <Badge tone="sage">{goalShort(today?.goal ?? "start")}</Badge>
            </div>
          </div>

          {today ? (
            <div className="flex flex-1 flex-col sm:flex-row">
              <Link
                href={`/app/practice/${today.id}`}
                className="group relative block min-h-[240px] overflow-hidden sm:w-[42%] sm:shrink-0"
                aria-label={`Начать практику «${today.title}»`}
              >
                <div className="absolute inset-0">
                  <PracticeCover tone={today.coverTone} variant={0} number="01" label={today.title} />
                </div>
                <span className="absolute inset-0 bg-gradient-to-t from-forest/30 to-transparent" />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-paper/95 text-forest shadow-lg transition-transform group-hover:scale-105">
                    <Play className="ml-1 h-5 w-5 fill-forest" />
                  </span>
                </span>
                {!canAccessPlan(subscription, today.requiredPlan) ? (
                  <span className="absolute right-3 top-3 badge bg-forest/90 text-ivory">
                    <Lock className="h-3 w-3" />
                    {today.requiredPlan === "guide" ? "Guide" : "Live"}
                  </span>
                ) : null}
              </Link>

              <div className="flex flex-1 flex-col p-5">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
                  {today.durationMinutes} минут ·{" "}
                  {today.difficulty === "beginner" ? "начальный" : today.difficulty === "intermediate" ? "средний" : "продвинутый"}
                </p>
                <h2 className="mt-2 font-serif text-[1.75rem] leading-tight">{today.title}</h2>
                <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-muted">{today.description}</p>
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#f7f3ea] px-3 py-2 text-[11.5px] leading-relaxed text-[#5c5f56]">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage" />
                  {recommendations[0]?.reason}
                </p>
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                  <Link href={`/app/practice/${today.id}`} className={buttonClass("primary", "sm")}>
                    Начать практику
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link href="/app/practice" className={buttonClass("secondary", "sm")}>
                    Выбрать другое
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-[13px] text-muted">
              Пока нет подходящих практик. <Link href="/app/practice" className="link-underline text-forest">Открыть библиотеку</Link>.
            </div>
          )}
        </section>

        {/* Регулярность + эфир */}
        <div className="space-y-5">
          <section className="surface p-5">
            <div className="flex items-start justify-between">
              <div>
                <Eyebrow>Регулярность</Eyebrow>
                <p className="mt-2 font-serif text-[2.4rem] leading-none">{stats.weekCount}</p>
                <p className="mt-1 text-[11.5px] text-muted">
                  {plural(stats.weekCount, ["практика", "практики", "практик"])} за 7 дней · {stats.weekMinutes} мин
                </p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-sage-soft px-2.5 py-1 text-[11px] text-forest">
                <Flame className="h-3.5 w-3.5" />
                {stats.currentStreak}
              </span>
            </div>

            <div className="mt-5 flex items-end justify-between gap-2">
              {week.map((day, index) => {
                const max = Math.max(1, ...week.map((item) => item.count));
                const height = day.count === 0 ? 6 : 12 + (day.count / max) * 34;
                return (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className={`w-full rounded-sm ${day.count > 0 ? "bg-forest/80" : "bg-[#e4e0d5]"}`}
                      style={{ height }}
                      title={`${day.date}: ${day.count}`}
                    />
                    <span className="text-[9.5px] uppercase tracking-wide text-muted">
                      {weekdayLabels[(new Date(day.date + "T00:00:00Z").getUTCDay() + 6) % 7]}
                    </span>
                  </div>
                );
              })}
            </div>

            <Link
              href="/app/progress"
              className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-forest hover:underline"
            >
              Смотреть прогресс
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </section>

          {live ? (
            <section className="surface p-5">
              <div className="flex items-center justify-between">
                <Eyebrow>Ближайший эфир</Eyebrow>
                {canAccessPlan(subscription, "live") ? <Badge tone="sage">Live</Badge> : <Badge>Только Live</Badge>}
              </div>
              <p className="mt-3 font-serif text-[1.15rem] leading-snug">{live.title}</p>
              <p className="mt-1.5 flex items-center gap-2 text-[12px] text-muted">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(live.startsAt, { weekday: "short", day: "numeric", month: "long" })} · {formatTime(live.startsAt)} МСК
              </p>
              <Link
                href="/app/schedule"
                className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-forest hover:underline"
              >
                {live.registered ? "Вы записаны" : "Расписание и запись"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </section>
          ) : null}
        </div>
      </div>

      {unfinished ? (
        <section className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl sm:w-32">
            <PracticeCover tone={unfinished.tone as CoverTone} variant={2} />
          </div>
          <div className="min-w-0 flex-1">
            <Eyebrow>Продолжить</Eyebrow>
            <p className="mt-1.5 font-serif text-[1.25rem] leading-snug">{unfinished.title}</p>
            <p className="mt-1 text-[12px] text-muted">
              Остановились на {Math.floor(unfinished.positionSeconds / 60)}:{String(Math.floor(unfinished.positionSeconds % 60)).padStart(2, "0")} из{" "}
              {formatMinutes(unfinished.durationMinutes)} · {relativeDays(unfinished.updatedAt)}
            </p>
            <Progress value={unfinished.positionSeconds} max={Math.max(unfinished.durationSeconds, unfinished.positionSeconds)} className="mt-3 max-w-xs" />
          </div>
          <Link href={`/app/practice/${unfinished.practiceId}`} className={buttonClass("primary", "sm", "shrink-0")}>
            Продолжить
            <Play className="h-3.5 w-3.5" />
          </Link>
        </section>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          {currentProgram ? (
            <section className="surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Eyebrow>Текущая программа</Eyebrow>
                  <h2 className="mt-2 font-serif text-[1.45rem] leading-snug">{currentProgram.program.title}</h2>
                </div>
                <span className="text-[12px] text-muted">
                  {currentProgram.completedCount}/{currentProgram.totalCount}
                </span>
              </div>
              <Progress value={currentProgram.percent} className="mt-4" label="Прогресс программы" />
              {currentProgram.currentLesson ? (
                <div className="mt-5 rounded-xl border border-line bg-[#faf7f0] p-4">
                  <p className="text-[10.5px] uppercase tracking-[0.14em] text-muted">Следующий урок</p>
                  <p className="mt-1.5 text-[14px] font-medium text-ink">{currentProgram.currentLesson.title}</p>
                  <p className="mt-1 text-[11.5px] text-muted">
                    {currentProgram.currentLesson.moduleTitle} · {formatMinutes(currentProgram.currentLesson.practiceDuration)}
                  </p>
                  <Link
                    href={`/app/practice/${currentProgram.currentLesson.practiceId}?lesson=${currentProgram.currentLesson.id}`}
                    className={buttonClass("primary", "sm", "mt-3")}
                  >
                    Продолжить урок
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : null}
              <Link
                href={`/app/programs/${currentProgram.program.id}`}
                className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-forest hover:underline"
              >
                Вся структура программы
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </section>
          ) : (
            <section className="surface p-5">
              <Eyebrow>Программы</Eyebrow>
              <h2 className="mt-2 font-serif text-[1.45rem] leading-snug">Практика с направлением</h2>
              <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-muted">
                Программа помогает не выбирать каждый раз заново. Начните с «Первых шагов» — три недели
                спокойного входа в практику.
              </p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {programs.slice(0, 2).map((item, index) => (
                  <Link
                    key={item.program.id}
                    href={`/app/programs/${item.program.id}`}
                    className="group flex items-center gap-3 rounded-xl border border-line p-2.5 transition-colors hover:bg-[#faf7f0]"
                  >
                    <span className="relative aspect-[4/3] w-16 shrink-0 overflow-hidden rounded-lg">
                      <PracticeCover tone={item.program.coverTone} variant={index} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium text-ink group-hover:text-forest">
                        {item.program.title}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-muted">
                        {item.program.lessonsCount} уроков · {item.percent}%
                      </span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {recent.length ? (
            <section className="surface p-5">
              <div className="flex items-center justify-between">
                <Eyebrow>Недавние практики</Eyebrow>
                <Link href="/app/progress" className="text-[11.5px] text-muted hover:text-forest">
                  Вся история
                </Link>
              </div>
              <div className="mt-2">
                {recent.map((item, index) => (
                  <RecentRow
                    key={item.id}
                    title={item.practiceTitle}
                    subtitle={`${formatMinutes(Math.round((item.durationSeconds ?? 0) / 60))} · завершено`}
                    date={item.completedAt}
                    href={`/app/practice/${item.practiceId}`}
                    index={index}
                    tone={item.tone}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <div className="space-y-5">
          <section className="surface p-5">
            <div className="flex items-center justify-between">
              <Eyebrow>STHIRA Guide</Eyebrow>
              <Sparkles className="h-4 w-4 text-sage" />
            </div>
            <p className="mt-3 font-serif text-[1.2rem] leading-snug">Не знаете, что выбрать сегодня?</p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
              Спросите наставника — он подберёт практику по времени и состоянию, опираясь на материалы школы.
            </p>
            <div className="mt-4 space-y-1.5">
              {["Подбери практику на 15 минут", "Как вернуться после перерыва?"].map((question) => (
                <Link
                  key={question}
                  href={`/app/guide?q=${encodeURIComponent(question)}`}
                  className="block rounded-lg border border-line bg-paper px-3 py-2 text-[11.5px] text-[#565950] transition-colors hover:border-sage hover:text-forest"
                >
                  {question}
                </Link>
              ))}
            </div>
            <Link
              href="/app/guide"
              className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-forest hover:underline"
            >
              {canAccessPlan(subscription, "guide") ? "Открыть Guide" : "Доступно на тарифе Guide"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>

          {active && stats.totalCompletions === 0 ? (
            <section className="rounded-[16px] border border-line bg-[#f7f3ea] p-5">
              <p className="text-[12px] font-medium text-ink">С чего начать</p>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">
                Первая практика — «Дыхание и опора», 15 минут. Она знакомит с дыханием и базовыми положениями.
              </p>
              <Link
                href="/app/practice?goal=start&duration=medium"
                className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium text-forest"
              >
                Показать практики
                <Check className="h-3.5 w-3.5" />
              </Link>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
