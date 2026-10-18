import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, Check, Home } from "lucide-react";
import { requireUser } from "@/lib/auth/guard";
import { one } from "@/lib/db";
import { getPracticeById, relatedPractices } from "@/lib/data/practices";
import { getProgressStats } from "@/lib/data/progress";
import { getSubscription } from "@/lib/data/subscriptions";
import { canAccessPlan } from "@/lib/access";
import { formatDate, formatMinutes } from "@/lib/format";
import { MoodPicker } from "./mood-picker";
import { ButtonLink } from "@/components/ui/button";
import { PracticeCover } from "@/components/covers/practice-cover";

export const metadata: Metadata = {
  title: "Практика завершена",
  robots: { index: false, follow: false },
};

export default async function CompletedPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { id } = await params;
  const { lesson } = await searchParams;
  const user = await requireUser(`/app/practice/${id}/completed`);
  const practice = getPracticeById(id, user.id);
  if (!practice) notFound();

  const completion = one<{
    id: string;
    completed_at: string;
    duration_seconds: number | null;
    mood: string | null;
    lesson_title: string | null;
    program_id: string | null;
    program_title: string | null;
  }>(
    `SELECT c.id, c.completed_at, c.duration_seconds, c.mood, l.title AS lesson_title,
            pr.id AS program_id, pr.title AS program_title
       FROM practice_completions c
       LEFT JOIN program_lessons l ON l.id = c.program_lesson_id
       LEFT JOIN program_modules m ON m.id = l.module_id
       LEFT JOIN programs pr ON pr.id = m.program_id
      WHERE c.user_id = ? AND c.practice_id = ?
      ORDER BY c.completed_at DESC LIMIT 1`,
    user.id,
    practice.id,
  );

  if (!completion) redirect(`/app/practice/${practice.id}`);

  const stats = getProgressStats(user.id);
  const subscription = getSubscription(user.id);
  const next = relatedPractices(practice, 3).filter((item) => canAccessPlan(subscription, item.requiredPlan))[0] ?? null;
  const week = stats.calendar.slice(-14);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="surface p-7 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e4ebe1] text-[#3f5a43]">
          <Check className="h-6 w-6" />
        </span>
        <h1 className="display-3 mt-5">Практика завершена</h1>
        <p className="mt-2 text-[13px] text-muted">
          {formatDate(completion.completed_at, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
          {completion.duration_seconds ? ` · ${formatMinutes(Math.round(completion.duration_seconds / 60))}` : ""}
        </p>
        <p className="mt-1 text-[13px] font-medium text-ink">{practice.title}</p>
        {completion.lesson_title && completion.program_title ? (
          <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
            Урок «{completion.lesson_title}» в программе{" "}
            <Link href={`/app/programs/${completion.program_id}`} className="link-underline text-forest">
              {completion.program_title}
            </Link>
          </p>
        ) : null}

        <div className="mt-6 border-t border-line pt-5">
          <p className="text-[10.5px] uppercase tracking-[0.14em] text-muted">Активность за две недели</p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {week.map((day) => (
              <span
                key={day.date}
                title={`${day.date}: ${day.count}`}
                className={`h-5 w-5 rounded-[4px] ${day.count > 0 ? "bg-forest/80" : "bg-[#eae6dc]"}`}
              />
            ))}
          </div>
        </div>
      </div>

      <MoodPicker completionId={completion.id} initial={completion.mood} />

      {next ? (
        <section className="surface mt-4 flex items-center gap-4 p-4">
          <div className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-xl">
            <PracticeCover tone={next.coverTone} variant={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] uppercase tracking-[0.14em] text-muted">Следующая практика</p>
            <p className="mt-1 font-serif text-[1.15rem] leading-snug">{next.title}</p>
            <p className="mt-0.5 text-[11px] text-muted">{next.durationMinutes} минут</p>
          </div>
          <Link href={`/app/practice/${next.id}`} className="btn btn-secondary btn-sm shrink-0">
            Открыть
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      ) : null}

      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <ButtonLink href="/app" variant="secondary">
          <Home className="h-4 w-4" />
          Вернуться на главную
        </ButtonLink>
        <ButtonLink href="/app/progress">Смотреть прогресс</ButtonLink>
      </div>
    </div>
  );
}
