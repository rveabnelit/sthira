import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth/guard";
import { getSubscription } from "@/lib/data/subscriptions";
import { getPracticeTags, listPractices } from "@/lib/data/practices";
import { getPreferences } from "@/lib/data/preferences";
import { lastUnfinishedPractice } from "@/lib/data/player";
import { recommendPractices } from "@/lib/data/recommend";
import { canAccessPlan, planRank } from "@/lib/access";
import { PracticeCard } from "@/components/cards/cards";
import { PracticeFilters } from "@/components/site/practice-filters";
import { PracticeCover } from "@/components/covers/practice-cover";
import { Badge, Eyebrow, EmptyState, Progress } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { formatMinutes } from "@/lib/format";
import type { CoverTone } from "@/content/catalog";

export const metadata: Metadata = {
  title: "Библиотека практик",
  robots: { index: false, follow: false },
};

type SearchParams = {
  q?: string;
  goal?: string;
  difficulty?: string;
  duration?: string;
  tag?: string;
  sort?: string;
  plan?: string;
};

export default async function AppLibraryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const user = await requireUser("/app/practice");
  const subscription = getSubscription(user.id);
  const prefs = getPreferences(user.id);
  const tags = getPracticeTags();
  const unfinished = lastUnfinishedPractice(user.id);

  const all = listPractices({
    q: params.q,
    goal: params.goal,
    difficulty: params.difficulty,
    duration: params.duration,
    tag: params.tag,
    sort: (params.sort as "recommended" | "newest" | "popular" | "shortest") ?? "recommended",
    userId: user.id,
    limit: 48,
  });

  const items = all.items.filter((practice) => {
    if (params.plan === "available") return canAccessPlan(subscription, practice.requiredPlan);
    if (params.plan === "guide") return practice.requiredPlan !== "practice";
    return true;
  });

  const personalized = recommendPractices({ userId: user.id, subscription, prefs, limit: 3 });
  const hasFilters = Boolean(params.q || params.goal || params.difficulty || params.duration || params.tag || params.plan);

  return (
    <div>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow>STHIRA Practice</Eyebrow>
          <h1 className="display-2 mt-2 text-[clamp(1.9rem,1.5rem+1.6vw,2.6rem)]">Библиотека практик</h1>
          <p className="mt-1.5 text-[13.5px] text-muted">
            {all.total} практик · фильтры по цели, уровню и длительности
          </p>
        </div>
        {!canAccessPlan(subscription, "practice") ? (
          <Badge tone="sand">Подписка неактивна</Badge>
        ) : (
          <Badge tone="success">Тариф {subscription?.planName}</Badge>
        )}
      </header>

      {unfinished ? (
        <section className="surface mt-6 flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl sm:w-28">
            <PracticeCover tone={unfinished.tone as CoverTone} variant={1} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] uppercase tracking-[0.14em] text-muted">Продолжить с места остановки</p>
            <p className="mt-1 font-serif text-[1.2rem] leading-snug">{unfinished.title}</p>
            <Progress
              value={unfinished.positionSeconds}
              max={Math.max(unfinished.durationSeconds, unfinished.positionSeconds)}
              className="mt-2 max-w-xs"
            />
          </div>
          <Link href={`/app/practice/${unfinished.practiceId}`} className="btn btn-primary btn-sm shrink-0">
            Продолжить
            <Clock className="h-3.5 w-3.5" />
          </Link>
        </section>
      ) : null}

      <section className="mt-6">
        <Suspense fallback={<div className="h-32" />}>
          <PracticeFilters
            total={items.length}
            tags={tags}
            basePath="/app/practice"
            showAvailability
            currentPlanRank={planRank(subscription?.planCode)}
          />
        </Suspense>
      </section>

      {!hasFilters && personalized.length ? (
        <section className="mt-8 rounded-[18px] border border-line bg-[#f7f3ea] p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sage" />
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Для тебя</p>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {personalized.map((item, index) => (
              <Link
                key={item.practice.id}
                href={`/app/practice/${item.practice.id}`}
                className="group rounded-xl border border-line bg-paper p-3 transition-colors hover:border-sage"
              >
                <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
                  <PracticeCover tone={item.practice.coverTone} variant={index} />
                </div>
                <p className="mt-2.5 text-[12.5px] font-medium leading-snug text-ink group-hover:text-forest">
                  {item.practice.title}
                </p>
                <p className="mt-0.5 text-[11px] text-muted">{formatMinutes(item.practice.durationMinutes)}</p>
                <p className="mt-1.5 line-clamp-2 text-[10.5px] leading-relaxed text-muted">{item.reason}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Ничего не нашлось"
            description="Попробуйте убрать один из фильтров или посмотреть всю библиотеку."
            action={
              <ButtonLink href="/app/practice" variant="secondary">
                Сбросить фильтры
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((practice, index) => (
            <PracticeCard
              key={practice.id}
              practice={practice}
              index={index}
              locked={!canAccessPlan(subscription, practice.requiredPlan)}
              href={`/app/practice/${practice.id}`}
            />
          ))}
        </div>
      )}

      {!canAccessPlan(subscription, "practice") ? (
        <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-[18px] border border-line bg-paper p-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-serif text-[1.25rem]">Подписка неактивна</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
              Откройте практики и программы по подписке. Прогресс и избранное сохранятся.
            </p>
          </div>
          <ButtonLink href="/pricing" size="sm">
            Выбрать тариф
            <ArrowRight className="h-3.5 w-3.5" />
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}
