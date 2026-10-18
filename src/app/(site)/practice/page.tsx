import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getSubscription } from "@/lib/data/subscriptions";
import { getPracticeTags, listPractices } from "@/lib/data/practices";
import { getPreferences } from "@/lib/data/preferences";
import { recommendPractices } from "@/lib/data/recommend";
import { canAccessPlan, planRank } from "@/lib/access";
import { PracticeCard } from "@/components/cards/cards";
import { PageHero } from "@/components/site/page-hero";
import { PracticeFilters } from "@/components/site/practice-filters";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Практики",
  description:
    "Каталог видеопрактик хатха-йоги: фильтры по цели, уровню и длительности. Занятия от 10 до 60 минут с рекомендациями преподавателя.",
  alternates: { canonical: "/practice" },
};

type SearchParams = {
  q?: string;
  goal?: string;
  difficulty?: string;
  duration?: string;
  tag?: string;
  sort?: string;
};

export default async function PracticesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const subscription = user ? getSubscription(user.id) : null;
  const prefs = user ? getPreferences(user.id) : null;
  const tags = getPracticeTags();

  const { items, total } = listPractices({
    q: params.q,
    goal: params.goal,
    difficulty: params.difficulty,
    duration: params.duration,
    tag: params.tag,
    sort: (params.sort as "recommended" | "newest" | "popular" | "shortest") ?? "recommended",
    userId: user?.id ?? null,
    limit: 48,
  });

  const personalized = user
    ? recommendPractices({ userId: user.id, subscription, prefs, limit: 3 })
    : [];
  const hasWideFilters = Boolean(params.q || params.goal || params.difficulty || params.duration || params.tag);

  return (
    <>
      <PageHero
        eyebrow="STHIRA Practice"
        title="Найди свою практику"
        description="Библиотека видеозанятий для домашней практики: от коротких пауз на десять минут до часовых последовательностей. Все практики — с описанием, уровнем и рекомендацией преподавателя."
      />

      <section className="container-app pb-20 pt-8">
        <Suspense fallback={<div className="h-32" />}>
          <PracticeFilters total={total} tags={tags} showAvailability={Boolean(user)} currentPlanRank={planRank(subscription?.planCode)} />
        </Suspense>

        {!hasWideFilters && personalized.length > 0 ? (
          <div className="mt-12 rounded-[20px] border border-line bg-paper p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow">
                  <Sparkles className="h-3.5 w-3.5" />
                  Для тебя
                </p>
                <h2 className="display-3 mt-2">Подобрано по вашей цели и времени</h2>
              </div>
              <p className="max-w-sm text-[12.5px] leading-relaxed text-muted">
                Рекомендации учитывают уровень, длительность и историю занятий. Их можно изменить в настройках.
              </p>
            </div>
            <div className="mt-6 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {personalized.map((item, index) => (
                <div key={item.practice.id}>
                  <PracticeCard
                    practice={item.practice}
                    index={index}
                    locked={!canAccessPlan(subscription, item.practice.requiredPlan)}
                    href={`/app/practice/${item.practice.id}`}
                  />
                  <p className="mt-2 text-[11.5px] leading-relaxed text-muted">{item.reason}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {items.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              title="По этим фильтрам ничего не нашлось"
              description="Попробуйте убрать часть условий или посмотреть все практики — возможно, подходящее занятие просто ждёт в другом разделе."
              action={
                <ButtonLink href="/practice" variant="secondary">
                  Сбросить фильтры
                </ButtonLink>
              }
            />
          </div>
        ) : (
          <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((practice, index) => {
              const locked = Boolean(user) && !canAccessPlan(subscription, practice.requiredPlan);
              return (
                <PracticeCard
                  key={practice.id}
                  practice={practice}
                  index={index}
                  locked={locked}
                  showFavorite={Boolean(user)}
                  href={user ? `/app/practice/${practice.id}` : `/practice/${practice.slug}`}
                />
              );
            })}
          </div>
        )}

        {!user ? (
          <div className="mt-14 flex flex-col items-start justify-between gap-5 rounded-[20px] border border-line bg-forest px-6 py-8 text-ivory md:flex-row md:items-center md:px-9">
            <div className="max-w-xl">
              <h2 className="font-serif text-[1.7rem] leading-tight text-ivory">Не знаете, с чего начать?</h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ivory/70">
                Четыре коротких вопроса — и мы предложим стартовый маршрут из реальных практик, а не случайную
                подборку.
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-ivory px-5 text-[13px] font-medium text-forest transition-colors hover:bg-white"
            >
              Подобрать маршрут
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : null}
      </section>
    </>
  );
}
