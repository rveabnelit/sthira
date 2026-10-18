import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { requireUser } from "@/lib/auth/guard";
import { listUserPrograms, listPrograms } from "@/lib/data/programs";
import { getSubscription } from "@/lib/data/subscriptions";
import { canAccessPlan } from "@/lib/access";
import { ProgramCard } from "@/components/cards/cards";
import { Badge, Eyebrow, EmptyState, Progress } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { difficultyLabel, formatMinutes } from "@/lib/format";

export const metadata: Metadata = {
  title: "Мои программы",
  robots: { index: false, follow: false },
};

export default async function AppProgramsPage() {
  const user = await requireUser("/app/programs");
  const subscription = getSubscription(user.id);
  const hasPracticeAccess = canAccessPlan(subscription, "practice");
  const programs = listUserPrograms(user.id, hasPracticeAccess);
  const active = programs.filter((item) => item.started && !item.completed);
  const available = programs.filter((item) => !item.started);
  const completed = programs.filter((item) => item.completed);
  const allPrograms = listPrograms({ limit: 20 });

  return (
    <div>
      <header className="flex flex-col gap-2">
        <Eyebrow>STHIRA Programs</Eyebrow>
        <h1 className="display-2 text-[clamp(1.9rem,1.5rem+1.6vw,2.6rem)]">Мои программы</h1>
        <p className="max-w-xl text-[13.5px] leading-relaxed text-muted">
          Программа — последовательность модулей и уроков. Проходите в своём темпе: доступ к следующему уроку не
          блокируется.
        </p>
      </header>

      {!hasPracticeAccess ? (
        <div className="mt-5 flex flex-col gap-3 rounded-[16px] border border-line bg-[#f7f3ea] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12.5px] leading-relaxed text-[#5c5f56]">
            Программы открываются по подписке. Структура и прогресс сохранятся после оплаты.
          </p>
          <Link href="/pricing" className={buttonClass("primary", "sm", "shrink-0")}>
            Выбрать тариф
          </Link>
        </div>
      ) : null}

      {active.length ? (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="display-3">В процессе</h2>
            <Badge tone="sage">{active.length}</Badge>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {active.map((item, index) => (
              <article key={item.program.id} className="surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10.5px] uppercase tracking-[0.14em] text-muted">
                      {item.program.estimatedDuration} · {difficultyLabel(item.program.difficulty)}
                    </p>
                    <h3 className="mt-1.5 font-serif text-[1.35rem] leading-snug">{item.program.title}</h3>
                  </div>
                  <span className="text-[11.5px] text-muted">
                    {item.completedCount}/{item.totalCount}
                  </span>
                </div>
                <Progress value={item.percent} className="mt-4" label={`Прогресс «${item.program.title}»`} />
                {item.currentLesson ? (
                  <div className="mt-4 rounded-xl border border-line bg-[#faf7f0] p-3.5">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Следующий урок</p>
                    <p className="mt-1 text-[13px] font-medium">{item.currentLesson.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {formatMinutes(item.currentLesson.practiceDuration)} · {item.currentLesson.moduleTitle}
                    </p>
                  </div>
                ) : null}
                <div className="mt-4 flex items-center gap-2">
                  <Link
                    href={
                      item.currentLesson
                        ? `/app/practice/${item.currentLesson.practiceId}?lesson=${item.currentLesson.id}`
                        : `/app/programs/${item.program.id}`
                    }
                    className={buttonClass("primary", "sm")}
                  >
                    Продолжить
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link href={`/app/programs/${item.program.id}`} className={buttonClass("secondary", "sm")}>
                    Структура
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {completed.length ? (
        <section className="mt-10">
          <h2 className="display-3">Завершённые</h2>
          <div className="mt-4 space-y-2">
            {completed.map((item) => (
              <Link
                key={item.program.id}
                href={`/app/programs/${item.program.id}`}
                className="flex items-center gap-4 rounded-xl border border-line bg-paper p-4 transition-colors hover:border-sage"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e4ebe1] text-[#3f5a43]">
                  <Compass className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium">{item.program.title}</span>
                  <span className="block text-[11.5px] text-muted">
                    {item.totalCount} уроков · завершено
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 text-muted" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <h2 className="display-3">Доступные программы</h2>
          <Link href="/programs" className="text-[11.5px] text-muted hover:text-forest">
            О программах
          </Link>
        </div>
        {available.length ? (
          <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {available.map((item, index) => (
              <ProgramCard
                key={item.program.id}
                program={item.program}
                index={index}
                href={`/app/programs/${item.program.id}`}
                progress={item.percent}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              title="Все программы уже начаты"
              description="Загляните в библиотеку практик или посмотрите программы школы."
              action={
                <Link href="/app/practice" className={buttonClass("secondary")}>
                  В библиотеку
                </Link>
              }
            />
          </div>
        )}
      </section>

      {allPrograms.length > 0 ? (
        <p className="mt-8 text-[11.5px] leading-relaxed text-muted">
          В школе {allPrograms.length} программы. Новые программы публикуются администратором и появляются здесь
          автоматически.
        </p>
      ) : null}
    </div>
  );
}
