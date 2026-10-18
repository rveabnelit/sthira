import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, Layers, Lock, Tag } from "lucide-react";
import { requireUser } from "@/lib/auth/guard";
import { getPracticeById, relatedPractices } from "@/lib/data/practices";
import { getSubscription } from "@/lib/data/subscriptions";
import { canAccessPlan, requiredPlanLabel } from "@/lib/access";
import { getWatchProgress } from "@/lib/data/player";
import { one } from "@/lib/db";
import { difficultyLabel, goalLabel, formatMinutes } from "@/lib/format";
import { trackEvent } from "@/lib/analytics";
import { FavoriteButton } from "@/components/cards/favorite-button";
import { PracticeCard } from "@/components/cards/cards";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Eyebrow } from "@/components/ui/primitives";
import { PracticePlayer } from "./player";

export const metadata: Metadata = {
  title: "Практика",
  robots: { index: false, follow: false },
};

export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { id } = await params;
  const { lesson: lessonId } = await searchParams;
  const user = await requireUser(`/app/practice/${id}`);
  const practice = getPracticeById(id, user.id);
  if (!practice || practice.status !== "published") notFound();

  const subscription = getSubscription(user.id);
  const hasAccess = canAccessPlan(subscription, practice.requiredPlan);

  const lesson = lessonId
    ? one<{
        id: string;
        title: string;
        module_title: string;
        program_id: string;
        program_title: string;
        program_slug: string;
        practice_id: string;
      }>(
        `SELECT l.id, l.title, m.title AS module_title, p.id AS program_id, p.title AS program_title,
                p.slug AS program_slug, l.practice_id
           FROM program_lessons l
           JOIN program_modules m ON m.id = l.module_id
           JOIN programs p ON p.id = m.program_id
          WHERE l.id = ?`,
        lessonId,
      )
    : null;
  const validLesson = lesson && lesson.practice_id === practice.id ? lesson : null;

  const progress = getWatchProgress(user.id, practice.id);
  const related = relatedPractices(practice, 3);
  trackEvent("practice_opened", { userId: user.id, props: { practiceId: practice.id, hasAccess } });

  return (
    <div>
      <Link
        href={validLesson ? `/app/programs/${validLesson.program_id}` : "/app/practice"}
        className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-forest"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {validLesson ? "К программе" : "К библиотеке"}
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          {validLesson ? (
            <p className="text-[10.5px] uppercase tracking-[0.16em] text-muted">
              {validLesson.program_title} · {validLesson.module_title}
            </p>
          ) : null}
          <h1 className="display-2 mt-1.5 text-[clamp(1.8rem,1.4rem+1.6vw,2.5rem)]">{practice.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone="sage">{goalLabel(practice.goal)}</Badge>
            <Badge>{difficultyLabel(practice.difficulty)}</Badge>
            <Badge>{formatMinutes(practice.durationMinutes)}</Badge>
          </div>
        </div>
        <FavoriteButton practiceId={practice.id} initial={practice.isFavorite} withLabel />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {hasAccess ? (
            <PracticePlayer
              practiceId={practice.id}
              title={practice.title}
              durationMinutes={practice.durationMinutes}
              videoUrl={practice.videoUrl}
              coverTone={practice.coverTone}
              lessonId={validLesson?.id ?? null}
              initialPosition={progress?.positionSeconds ?? 0}
              teacherNote={practice.teacherNote}
            />
          ) : (
            <div className="overflow-hidden rounded-[20px] border border-line bg-paper">
              <div className="flex aspect-video flex-col items-center justify-center gap-4 bg-[#f2ede3] px-6 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-paper text-forest">
                  <Lock className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-serif text-[1.4rem] leading-snug">Практика доступна по подписке</p>
                  <p className="mt-1.5 text-[12.5px] text-muted">
                    Нужен тариф {requiredPlanLabel(practice.requiredPlan)} или выше
                  </p>
                </div>
                <ButtonLink href="/pricing" size="sm">
                  Выбрать тариф
                  <ArrowRight className="h-3.5 w-3.5" />
                </ButtonLink>
              </div>
              <div className="p-5">
                <p className="text-[13px] leading-relaxed text-[#4d5048]">{practice.description}</p>
              </div>
            </div>
          )}

          <section className="mt-6">
            <h2 className="text-[11px] uppercase tracking-[0.16em] text-muted">О практике</h2>
            <div className="prose-app mt-3">
              <p>{practice.description}</p>
            </div>
          </section>

          {related.length ? (
            <section className="mt-8 border-t border-line pt-6">
              <div className="flex items-center justify-between">
                <h2 className="display-4">Что дальше</h2>
                <Link href="/app/practice" className="text-[11.5px] text-muted hover:text-forest">
                  Вся библиотека
                </Link>
              </div>
              <div className="mt-4 grid gap-x-5 gap-y-6 sm:grid-cols-3">
                {related.map((item, index) => (
                  <PracticeCard
                    key={item.id}
                    practice={item}
                    index={index}
                    compact
                    showFavorite={false}
                    href={`/app/practice/${item.id}`}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="surface p-5">
            <Eyebrow>Детали занятия</Eyebrow>
            <dl className="mt-4 space-y-3 text-[12.5px]">
              <div className="flex items-center gap-2.5">
                <Clock className="h-3.5 w-3.5 text-muted" />
                <dt className="text-muted">Длительность</dt>
                <dd className="ml-auto font-medium">{practice.durationMinutes} мин</dd>
              </div>
              <div className="flex items-center gap-2.5">
                <Layers className="h-3.5 w-3.5 text-muted" />
                <dt className="text-muted">Уровень</dt>
                <dd className="ml-auto font-medium">{difficultyLabel(practice.difficulty)}</dd>
              </div>
              <div className="flex items-center gap-2.5">
                <Tag className="h-3.5 w-3.5 text-muted" />
                <dt className="text-muted">Цель</dt>
                <dd className="ml-auto font-medium">{goalLabel(practice.goal)}</dd>
              </div>
            </dl>
            {practice.tags.length ? (
              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line pt-4">
                {practice.tags.map((tag) => (
                  <span key={tag} className="badge">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {validLesson ? (
            <div className="surface p-5">
              <Eyebrow>Урок программы</Eyebrow>
              <p className="mt-2 text-[13.5px] font-medium leading-snug">{validLesson.title}</p>
              <p className="mt-1 text-[11.5px] text-muted">{validLesson.module_title}</p>
              <Link
                href={`/app/programs/${validLesson.program_id}`}
                className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium text-forest hover:underline"
              >
                Структура программы
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : null}

          <div className="rounded-[16px] border border-line bg-[#f7f3ea] p-4">
            <p className="text-[11px] font-medium text-ink">Безопасность</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
              Останавливайтесь при боли или головокружении. Практика не заменяет консультацию специалиста.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
