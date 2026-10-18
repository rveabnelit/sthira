import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock, Layers, Lock, Play, Quote, Tag } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getSubscription } from "@/lib/data/subscriptions";
import { getPracticeBySlug, relatedPractices, listProgramsForPractice } from "@/lib/data/practices";
import { canAccessPlan, requiredPlanLabel } from "@/lib/access";
import { difficultyLabel, formatMinutes, goalLabel } from "@/lib/format";
import { PracticeCover } from "@/components/covers/practice-cover";
import { PracticeCard } from "@/components/cards/cards";
import { Breadcrumbs } from "@/components/site/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Eyebrow } from "@/components/ui/primitives";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const practice = getPracticeBySlug(slug);
  if (!practice) return { title: "Практика не найдена" };
  return {
    title: practice.title,
    description: practice.description.slice(0, 160),
    alternates: { canonical: `/practice/${practice.slug}` },
    openGraph: { title: `${practice.title} — STHIRA`, description: practice.description.slice(0, 160) },
  };
}

export default async function PracticeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const practice = getPracticeBySlug(slug);
  if (!practice || practice.status !== "published") notFound();

  const user = await getCurrentUser();
  const subscription = user ? getSubscription(user.id) : null;
  const hasAccess = canAccessPlan(subscription, practice.requiredPlan);
  const related = relatedPractices(practice, 3);
  const programs = listProgramsForPractice(practice.id);
  const appHref = `/app/practice/${practice.id}`;
  const startHref = user ? (hasAccess ? appHref : "/app/subscription") : `/login?next=${encodeURIComponent(appHref)}`;

  return (
    <div className="container-app pb-20 pt-8">
      <Breadcrumbs items={[{ href: "/practice", label: "Практики" }, { label: practice.title }]} />

      <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="sage">{goalLabel(practice.goal)}</Badge>
            <Badge>{difficultyLabel(practice.difficulty)}</Badge>
            <Badge>{formatMinutes(practice.durationMinutes)}</Badge>
            {practice.requiredPlan !== "practice" ? <Badge tone="sand">{requiredPlanLabel(practice.requiredPlan)}</Badge> : null}
          </div>
          <h1 className="display-1 mt-4 text-[clamp(2.2rem,1.7rem+2.6vw,3.4rem)]">{practice.title}</h1>
          <p className="lede mt-4 max-w-2xl">{practice.description}</p>

          <div className="relative mt-8 overflow-hidden rounded-[20px] border border-line bg-[#1d2c24]">
            <div className="relative aspect-video">
              <PracticeCover tone={practice.coverTone} variant={practice.slug.length} label={practice.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-forest/55 via-forest/10 to-transparent" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
                {hasAccess ? (
                  <Link
                    href={appHref}
                    className="group inline-flex flex-col items-center gap-3"
                    aria-label={`Начать практику «${practice.title}»`}
                  >
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-paper/95 text-forest shadow-lg transition-transform group-hover:scale-105">
                      <Play className="ml-1 h-6 w-6 fill-forest" />
                    </span>
                    <span className="text-[12px] uppercase tracking-[0.16em] text-ivory/80">Начать практику</span>
                  </Link>
                ) : (
                  <>
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-paper/90 text-forest">
                      <Lock className="h-5 w-5" />
                    </span>
                    <p className="max-w-xs px-4 text-[13px] leading-relaxed text-ivory/85">
                      {user
                        ? `Практика доступна на тарифе ${requiredPlanLabel(practice.requiredPlan)} и выше`
                        : "Войдите в аккаунт, чтобы начать занятие"}
                    </p>
                    <Link
                      href={startHref}
                      className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-ivory px-4 text-[12.5px] font-medium text-forest transition-colors hover:bg-white"
                    >
                      {user ? "Перейти к тарифу" : "Войти"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </>
                )}
              </div>
              <span className="absolute bottom-4 left-4 text-[11px] uppercase tracking-[0.16em] text-ivory/70">
                {practice.durationMinutes} минут · хатха-йога
              </span>
            </div>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-[1fr_260px]">
            <div>
              <h2 className="display-3">Об этой практике</h2>
              <div className="prose-app mt-4">
                <p>{practice.description}</p>
                <p>
                  Занятие построено как последовательность: разминка, основная часть и спокойное завершение.
                  Выполняйте движения в комфортной амплитуде и не задерживайте дыхание. Если появляется боль —
                  остановитесь.
                </p>
              </div>

              {practice.teacherNote ? (
                <blockquote className="mt-8 rounded-[16px] border border-line bg-paper p-6">
                  <Quote className="h-4 w-4 text-sage" />
                  <p className="mt-3 text-[14px] leading-relaxed text-[#4d5048]">{practice.teacherNote}</p>
                  <footer className="mt-4 text-[11.5px] uppercase tracking-[0.12em] text-muted">
                    Мария Васильева · рекомендация преподавателя
                  </footer>
                </blockquote>
              ) : null}
            </div>

            <div>
              <h3 className="text-[11px] uppercase tracking-[0.16em] text-muted">Детали</h3>
              <dl className="mt-4 space-y-3 text-[13px]">
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-muted" />
                  <dt className="text-muted">Длительность</dt>
                  <dd className="ml-auto font-medium">{practice.durationMinutes} мин</dd>
                </div>
                <div className="flex items-center gap-2.5">
                  <Layers className="h-4 w-4 text-muted" />
                  <dt className="text-muted">Уровень</dt>
                  <dd className="ml-auto font-medium">{difficultyLabel(practice.difficulty)}</dd>
                </div>
                <div className="flex items-center gap-2.5">
                  <Tag className="h-4 w-4 text-muted" />
                  <dt className="text-muted">Цель</dt>
                  <dd className="ml-auto font-medium">{goalLabel(practice.goal)}</dd>
                </div>
              </dl>

              {practice.tags.length ? (
                <>
                  <h3 className="mt-6 text-[11px] uppercase tracking-[0.16em] text-muted">Теги</h3>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {practice.tags.map((tag) => (
                      <Link key={tag} href={`/practice?tag=${encodeURIComponent(tag)}`} className="badge hover:bg-sand-soft">
                        {tag}
                      </Link>
                    ))}
                  </div>
                </>
              ) : null}

              {programs.length ? (
                <>
                  <h3 className="mt-6 text-[11px] uppercase tracking-[0.16em] text-muted">Входит в программы</h3>
                  <ul className="mt-3 space-y-2">
                    {programs.map((program) => (
                      <li key={program.id}>
                        <Link
                          href={`/programs/${program.slug}`}
                          className="flex items-center justify-between gap-2 text-[13px] text-[#4d5048] transition-colors hover:text-forest"
                        >
                          {program.title}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="surface p-5">
            <Eyebrow>Начать занятие</Eyebrow>
            <p className="mt-3 font-serif text-[1.3rem] leading-snug">
              {hasAccess ? "Практика открыта на вашем тарифе" : `Нужен тариф ${requiredPlanLabel(practice.requiredPlan)}`}
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
              {hasAccess
                ? "Прогресс сохранится автоматически. Можно вернуться к практике в любой момент."
                : "Оформите подписку, чтобы открыть библиотеку и программы школы."}
            </p>
            <ButtonLink href={startHref} className="mt-5 w-full">
              {hasAccess ? "Открыть занятие" : user ? "Выбрать тариф" : "Войти и начать"}
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            {!user ? (
              <Link href="/pricing" className="mt-3 block text-center text-[12px] text-muted underline-offset-4 hover:underline">
                Сравнить тарифы
              </Link>
            ) : null}
            <div className="mt-5 border-t border-line pt-4">
              <p className="text-[11.5px] leading-relaxed text-muted">
                Практика не заменяет медицинскую помощь. При травмах и ограничениях сначала
                проконсультируйтесь со специалистом.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {related.length ? (
        <section className="mt-16 border-t border-line pt-10">
          <div className="flex items-end justify-between gap-4">
            <h2 className="display-3">Похожие практики</h2>
            <Link href="/practice" className="btn-ghost inline-flex items-center gap-1.5 pb-1 text-[13px]">
              Все практики
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-6 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item, index) => (
              <PracticeCard key={item.id} practice={item} index={index} showFavorite={false} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
