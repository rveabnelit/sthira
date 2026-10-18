import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Clock, Lock, PlayCircle } from "lucide-react";
import { requireUser } from "@/lib/auth/guard";
import { getProgramById, getProgramModules, buildProgramProgress } from "@/lib/data/programs";
import { getSubscription } from "@/lib/data/subscriptions";
import { canAccessPlan } from "@/lib/access";
import { difficultyLabel, formatMinutes } from "@/lib/format";
import { PracticeCover } from "@/components/covers/practice-cover";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Eyebrow, Progress } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Программа",
  robots: { index: false, follow: false },
};

export default async function AppProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/app/programs/${id}`);
  const program = getProgramById(id);
  if (!program) notFound();

  const subscription = getSubscription(user.id);
  const hasAccess = canAccessPlan(subscription, program.requiredPlan);
  const modules = getProgramModules(program.id);
  const progress = buildProgramProgress(program, modules, user.id, hasAccess);

  return (
    <div>
      <Link href="/app/programs" className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-forest">
        <ArrowLeft className="h-3.5 w-3.5" />
        Мои программы
      </Link>

      <header className="mt-5 grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
        <div>
          <Eyebrow>{program.estimatedDuration} · {program.lessonsPerWeek} урока в неделю</Eyebrow>
          <h1 className="display-2 mt-2 text-[clamp(1.9rem,1.5rem+1.8vw,2.8rem)]">{program.title}</h1>
          <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-muted">{program.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge tone="sage">{difficultyLabel(program.difficulty)}</Badge>
            <Badge>{progress.totalCount} уроков</Badge>
            <Badge>{program.estimatedDuration}</Badge>
            {!hasAccess ? <Badge tone="sand">Нужен тариф {program.requiredPlan === "guide" ? "Guide" : "Live"}</Badge> : null}
          </div>
        </div>

        <div className="surface overflow-hidden">
          <div className="relative aspect-[16/10]">
            <PracticeCover tone={program.coverTone} variant={1} label={program.title} />
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between text-[11.5px]">
              <span className="text-muted">Прогресс</span>
              <span className="font-medium">{progress.percent}%</span>
            </div>
            <Progress value={progress.percent} className="mt-2" />
            <p className="mt-2 text-[11px] text-muted">
              {progress.completedCount} из {progress.totalCount} уроков завершено
            </p>
            {hasAccess && progress.currentLesson ? (
              <ButtonLink
                href={`/app/practice/${progress.currentLesson.practiceId}?lesson=${progress.currentLesson.id}`}
                size="sm"
                className="mt-3 w-full"
              >
                Продолжить урок
                <ArrowRight className="h-3.5 w-3.5" />
              </ButtonLink>
            ) : !hasAccess ? (
              <ButtonLink href="/pricing" size="sm" className="mt-3 w-full">
                Открыть по подписке
              </ButtonLink>
            ) : (
              <p className="mt-3 rounded-lg bg-[#f3f6ef] px-3 py-2 text-center text-[11px] text-[#3f5a43]">
                Все уроки завершены
              </p>
            )}
          </div>
        </div>
      </header>

      <section className="mt-8">
        <div className="flex items-end justify-between">
          <h2 className="display-3">План занятий</h2>
          <p className="text-[11.5px] text-muted">Доступ к урокам не блокируется по расписанию</p>
        </div>

        <div className="mt-4 space-y-4">
          {progress.modules.map((module, moduleIndex) => (
            <div key={module.id} className="overflow-hidden rounded-[16px] border border-line bg-paper">
              <div className="flex items-center justify-between gap-4 border-b border-line bg-[#f7f3ea] px-5 py-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] uppercase tracking-[0.14em] text-muted">Модуль {moduleIndex + 1}</span>
                    {module.completedCount === module.lessons.length ? <Check className="h-3 w-3 text-[#4f6b52]" /> : null}
                  </div>
                  <p className="mt-0.5 text-[13.5px] font-medium">{module.title}</p>
                </div>
                <span className="text-[11px] text-muted">
                  {module.completedCount}/{module.lessons.length}
                </span>
              </div>
              <ul>
                {module.lessons.map((lesson) => {
                  const locked = lesson.state === "locked";
                  return (
                    <li key={lesson.id} className="border-b border-line last:border-0">
                      {locked ? (
                        <div className="flex items-center gap-4 px-5 py-3.5">
                          <span className="grid h-7 w-7 place-items-center rounded-full border border-line text-muted">
                            <Lock className="h-3 w-3" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13.5px] text-ink">{lesson.title}</span>
                            <span className="mt-0.5 block text-[11px] text-muted">
                              {formatMinutes(lesson.practiceDuration)} · доступно по подписке
                            </span>
                          </span>
                        </div>
                      ) : (
                        <Link
                          href={`/app/practice/${lesson.practiceId}?lesson=${lesson.id}`}
                          className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[#faf7f0]"
                        >
                          <span
                            className={cn(
                              "grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[11px]",
                              lesson.completed
                                ? "border-forest bg-forest text-ivory"
                                : lesson.state === "current"
                                  ? "border-forest text-forest"
                                  : "border-line text-muted",
                            )}
                          >
                            {lesson.completed ? <Check className="h-3.5 w-3.5" /> : lesson.position}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13.5px] text-ink group-hover:text-forest">
                              {lesson.title}
                            </span>
                            <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted">
                              <Clock className="h-3 w-3" />
                              {formatMinutes(lesson.practiceDuration)} · {difficultyLabel(lesson.practiceDifficulty)}
                            </span>
                          </span>
                          {lesson.state === "current" ? (
                            <Badge tone="sage">Текущий</Badge>
                          ) : lesson.completed ? (
                            <span className="text-[10.5px] text-muted">
                              {lesson.completedAt
                                ? new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(new Date(lesson.completedAt))
                                : "готово"}
                            </span>
                          ) : (
                            <PlayCircle className="h-4 w-4 text-muted" />
                          )}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-[16px] border border-line bg-[#f7f3ea] p-5">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Материалы преподавателя</p>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[#4d5048]">
          Программа собрана так, чтобы нагрузка росла постепенно. Если урок даётся тяжело, останьтесь на нём ещё
          неделю — это нормальная часть практики. Пропуск недели не закрывает доступ к урокам.
        </p>
        <Link href="/about" className="link-underline mt-3 inline-block text-[12px] text-forest">
          О преподавателе
        </Link>
      </section>
    </div>
  );
}
