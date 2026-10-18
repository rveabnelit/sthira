import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Clock, Lock, PlayCircle, Sparkles, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getSubscription } from "@/lib/data/subscriptions";
import { buildProgramProgress, getProgramBySlug, getProgramModules } from "@/lib/data/programs";
import { canAccessPlan, requiredPlanLabel } from "@/lib/access";
import { difficultyLabel, formatMinutes } from "@/lib/format";
import { PracticeCover } from "@/components/covers/practice-cover";
import { Breadcrumbs } from "@/components/site/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Eyebrow, Progress } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const program = getProgramBySlug(slug);
  if (!program) return { title: "Программа не найдена" };
  return {
    title: program.title,
    description: program.shortDescription,
    alternates: { canonical: `/programs/${program.slug}` },
  };
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = getProgramBySlug(slug);
  if (!program || program.status !== "published") notFound();

  const user = await getCurrentUser();
  const subscription = user ? getSubscription(user.id) : null;
  const hasAccess = canAccessPlan(subscription, program.requiredPlan);
  const modules = getProgramModules(program.id);
  const progress = buildProgramProgress(program, modules, user?.id ?? null, hasAccess);
  const appHref = `/app/programs/${program.id}`;
  const ctaHref = user ? (hasAccess ? appHref : "/app/subscription") : `/login?next=${encodeURIComponent(appHref)}`;

  return (
    <div className="container-app pb-20 pt-8">
      <Breadcrumbs items={[{ href: "/programs", label: "Программы" }, { label: program.title }]} />

      <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">
        <div>
          <Eyebrow className="mb-4">Программа · {program.estimatedDuration}</Eyebrow>
          <h1 className="display-1 text-[clamp(2.2rem,1.7rem+2.6vw,3.6rem)]">{program.title}</h1>
          <p className="lede mt-4 max-w-2xl">{program.description}</p>

          <dl className="mt-8 grid grid-cols-2 gap-6 border-y border-line py-5 sm:grid-cols-4">
            {[
              { label: "Длительность", value: program.estimatedDuration },
              { label: "Уроков", value: `${progress.totalCount}` },
              { label: "Ритм", value: `${program.lessonsPerWeek} в неделю` },
              { label: "Уровень", value: difficultyLabel(program.difficulty) },
            ].map((item) => (
              <div key={item.label}>
                <dt className="text-[10.5px] uppercase tracking-[0.14em] text-muted">{item.label}</dt>
                <dd className="mt-1.5 text-[13.5px] font-medium text-ink">{item.value}</dd>
              </div>
            ))}
          </dl>

          {program.audience ? (
            <section className="mt-10">
              <h2 className="display-3">Для кого</h2>
              <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-[#4d5048]">{program.audience}</p>
            </section>
          ) : null}

          {program.outcomes.length ? (
            <section className="mt-8">
              <h2 className="display-3">Чему посвящена программа</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {program.outcomes.map((outcome) => (
                  <li key={outcome} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-[#4d5048]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#6f7d68]" />
                    {outcome}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-12">
            <div className="flex items-end justify-between gap-4">
              <h2 className="display-3">Структура программы</h2>
              {user && hasAccess ? (
                <span className="text-[12px] text-muted">
                  Пройдено {progress.completedCount} из {progress.totalCount}
                </span>
              ) : null}
            </div>

            {user && hasAccess ? <Progress value={progress.percent} className="mt-4" label="Прогресс программы" /> : null}

            <div className="mt-6 space-y-5">
              {progress.modules.map((module, moduleIndex) => (
                <div key={module.id} className="overflow-hidden rounded-[16px] border border-line bg-paper">
                  <div className="flex items-center justify-between gap-4 border-b border-line bg-[#f7f3ea] px-5 py-3.5">
                    <div>
                      <p className="text-[13.5px] font-medium text-ink">{module.title}</p>
                      {module.description ? <p className="mt-0.5 text-[11.5px] text-muted">{module.description}</p> : null}
                    </div>
                    <span className="shrink-0 text-[11px] text-muted">
                      {module.completedCount}/{module.lessons.length}
                    </span>
                  </div>
                  <ul>
                    {module.lessons.map((lesson) => {
                      const locked = !hasAccess && program.requiredPlan !== "practice";
                      return (
                        <li key={lesson.id} className="border-b border-line last:border-0">
                          {hasAccess ? (
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
                                {lesson.completed ? <Check className="h-3.5 w-3.5" /> : moduleIndex + 1 + "." + lesson.position}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13.5px] text-ink group-hover:text-forest">
                                  {lesson.title}
                                </span>
                                <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted">
                                  <Clock className="h-3 w-3" />
                                  {formatMinutes(lesson.practiceDuration)}
                                  <span>· {difficultyLabel(lesson.practiceDifficulty)}</span>
                                </span>
                              </span>
                              {lesson.state === "current" ? <Badge tone="sage">Продолжить</Badge> : null}
                              <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
                            </Link>
                          ) : (
                            <div className="flex items-center gap-4 px-5 py-3.5">
                              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-muted">
                                {locked ? <Lock className="h-3 w-3" /> : lesson.position}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13.5px] text-ink">{lesson.title}</span>
                                <span className="mt-0.5 block text-[11px] text-muted">
                                  {formatMinutes(lesson.practiceDuration)} · {difficultyLabel(lesson.practiceDifficulty)}
                                </span>
                              </span>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11.5px] leading-relaxed text-muted">
              Порядок и состав уроков определяет преподаватель. Программа не блокирует доступ к следующему уроку,
              если неделя растянулась.
            </p>
          </section>

          <section className="mt-12 rounded-[18px] border border-line bg-paper p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-sand-soft font-serif text-sm text-forest">
                МВ
              </span>
              <div>
                <p className="font-serif text-[1.15rem] leading-tight">Мария Васильева</p>
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted">Автор программы</p>
              </div>
            </div>
            <p className="mt-4 text-[13.5px] leading-relaxed text-[#4d5048]">
              Программа собрана так, чтобы нагрузка росла постепенно. Если вы чувствуете, что урок даётся тяжело,
              останьтесь на нём ещё неделю — это нормальная часть практики.
            </p>
            <Link href="/about" className="link-underline mt-3 inline-block text-[12.5px] text-forest">
              Об авторе
            </Link>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="overflow-hidden rounded-[20px] border border-line bg-paper">
            <div className="relative aspect-[4/3]">
              <PracticeCover tone={program.coverTone} variant={1} label={program.title} />
              <div className="absolute left-4 top-4">
                <Badge tone="sage">{difficultyLabel(program.difficulty)}</Badge>
              </div>
            </div>
            <div className="p-5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Программа</p>
              <p className="mt-1.5 font-serif text-[1.5rem] leading-tight">{program.title}</p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{program.shortDescription}</p>

              <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-[12.5px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Уроков</dt>
                  <dd className="font-medium">{progress.totalCount}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Длительность</dt>
                  <dd className="font-medium">{program.estimatedDuration}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Доступ</dt>
                  <dd className="font-medium">{requiredPlanLabel(program.requiredPlan)}</dd>
                </div>
                {user && hasAccess ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Прогресс</dt>
                    <dd className="font-medium">{progress.percent}%</dd>
                  </div>
                ) : null}
              </dl>

              <ButtonLink href={ctaHref} className="mt-5 w-full">
                {hasAccess ? (progress.completedCount > 0 ? "Продолжить программу" : "Начать программу") : user ? "Открыть по подписке" : "Начать программу"}
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>

              {!hasAccess ? (
                <p className="mt-3 flex items-start gap-2 text-[11.5px] leading-relaxed text-muted">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage" />
                  Доступ к программе открывается на тарифе {requiredPlanLabel(program.requiredPlan)} и выше.
                </p>
              ) : (
                <p className="mt-3 flex items-start gap-2 text-[11.5px] leading-relaxed text-muted">
                  <PlayCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage" />
                  Прогресс сохраняется автоматически после завершения каждого урока.
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-[16px] border border-line bg-[#f7f3ea] p-4">
            <p className="flex items-center gap-2 text-[12px] font-medium text-ink">
              <Users className="h-4 w-4 text-[#6f7d68]" />
              Кому подойдёт
            </p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-muted">{program.audience}</p>
          </div>
        </aside>
      </div>

      <section className="mt-16 border-t border-line pt-10">
        <h2 className="display-3">Частые вопросы о программе</h2>
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          {[
            {
              q: "Можно ли проходить программу медленнее?",
              a: "Да. Уроки не привязаны к календарю: доступ к следующему не блокируется, а прогресс сохраняется.",
            },
            {
              q: "Что будет, если пропустить неделю?",
              a: "Ничего. Вернитесь к текущему уроку или начните с короткой практики — программа подстроится под ваш темп.",
            },
            {
              q: "Нужно ли проходить уроки подряд?",
              a: "Желательно двигаться по порядку, но можно возвращаться к уже пройденным урокам без ограничений.",
            },
            {
              q: "Доступна ли программа на моём тарифе?",
              a: `Программа открывается на тарифе ${requiredPlanLabel(program.requiredPlan)} и выше. Проверить тариф можно в разделе «Подписка».`,
            },
          ].map((item) => (
            <div key={item.q} className="border-t border-line pt-4">
              <p className="text-[14px] font-medium text-ink">{item.q}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
