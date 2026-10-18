import Link from "next/link";
import { ArrowRight, CalendarDays, Lock, Play, Users } from "lucide-react";
import type { CoverTone } from "@/content/catalog";
import type { LiveSession, Practice, Program } from "@/lib/types";
import { PracticeCover } from "@/components/covers/practice-cover";
import { FavoriteButton } from "@/components/cards/favorite-button";
import { Badge, Progress } from "@/components/ui/primitives";
import { difficultyLabel, formatDate, formatTime, goalShort, plural, relativeDays } from "@/lib/format";
import { cn } from "@/lib/cn";

type PracticeLike = Practice & { isFavorite?: boolean; isCompleted?: boolean };

export function PracticeCard({
  practice,
  index = 0,
  locked = false,
  recommended = false,
  showFavorite = true,
  compact = false,
  href,
  className,
}: {
  practice: PracticeLike;
  index?: number;
  locked?: boolean;
  recommended?: boolean;
  showFavorite?: boolean;
  compact?: boolean;
  href?: string;
  className?: string;
}) {
  const target = href ?? `/practice/${practice.slug}`;
  const number = String(index + 1).padStart(2, "0");

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="relative overflow-hidden rounded-[18px] border border-line">
        <Link href={target} aria-label={`Открыть практику «${practice.title}»`} className="block">
          <div className="relative aspect-[4/3]">
            <PracticeCover
              tone={practice.coverTone}
              variant={index}
              number={number}
              label={`${practice.title}, ${practice.durationMinutes} минут`}
            />
            <span className="absolute inset-0 bg-gradient-to-t from-forest/25 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
        </Link>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <span className="badge pointer-events-none bg-white/75 text-ink backdrop-blur">
            {practice.durationMinutes} мин
          </span>
          {showFavorite ? (
            <div className="pointer-events-auto">
              <FavoriteButton practiceId={practice.id} initial={Boolean(practice.isFavorite)} />
            </div>
          ) : null}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
          <span className="badge pointer-events-none bg-forest/85 text-ivory backdrop-blur">
            {goalShort(practice.goal)}
          </span>
          <div className="flex items-center gap-1.5">
            {recommended ? <Badge tone="sand">Для тебя</Badge> : null}
            {locked ? (
              <span className="badge bg-forest/90 text-ivory backdrop-blur">
                <Lock className="h-3 w-3" />
                {practice.requiredPlan === "live" ? "Live" : "Guide"}
              </span>
            ) : null}
          </div>
        </div>

        <Link
          href={target}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 hidden items-center justify-center sm:grid"
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-paper/90 text-forest opacity-0 shadow-sm backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
            <Play className="ml-0.5 h-5 w-5 fill-forest" />
          </span>
        </Link>
      </div>

      <div className={cn("flex flex-1 flex-col pt-3.5", compact && "pt-3")}>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[11px] uppercase tracking-[0.14em] text-muted">
            {difficultyLabel(practice.difficulty)}
          </span>
          <span className="text-[11px] text-muted">{practice.isCompleted ? "Пройдено" : `№ ${number}`}</span>
        </div>
        <h3 className="mt-1.5 text-[1.0625rem] leading-snug text-ink">
          <Link href={target} className="transition-colors hover:text-forest">
            {practice.title}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted">{practice.description}</p>
      </div>
    </article>
  );
}

export function ProgramCard({
  program,
  index = 0,
  href,
  progress,
  className,
}: {
  program: Program;
  index?: number;
  href?: string;
  progress?: number;
  className?: string;
}) {
  const target = href ?? `/programs/${program.slug}`;
  return (
    <article className={cn("surface group flex flex-col overflow-hidden", className)}>
      <Link href={target} className="block">
        <div className="relative aspect-[16/10]">
          <PracticeCover
            tone={program.coverTone}
            variant={index}
            label={`Программа «${program.title}»`}
            className="transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
            <Badge tone="sage">{difficultyLabel(program.difficulty)}</Badge>
            <span className="badge bg-white/75 text-ink backdrop-blur">{program.estimatedDuration}</span>
          </div>
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <span className="text-[11px] uppercase tracking-[0.14em] text-muted">
          {program.lessonsCount ?? "—"} {plural(program.lessonsCount ?? 0, ["урок", "урока", "уроков"])} ·{" "}
          {program.lessonsPerWeek} {plural(program.lessonsPerWeek, ["раз", "раза", "раз"])} в неделю
        </span>
        <h3 className="mt-2 text-[1.25rem] leading-snug">
          <Link href={target} className="transition-colors hover:text-forest">
            {program.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted">{program.shortDescription}</p>
        {typeof progress === "number" ? (
          <div className="mt-auto pt-5">
            <div className="mb-2 flex items-center justify-between text-[11px] text-muted">
              <span>Прогресс</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        ) : (
          <div className="mt-auto pt-5">
            <Link
              href={target}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-forest transition-colors hover:text-forest-deep"
            >
              Смотреть программу
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}

export function LiveCard({ session, action }: { session: LiveSession; action?: React.ReactNode }) {
  const seatsLeft = Math.max(0, session.capacity - (session.registrationCount ?? 0));
  return (
    <article className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-sage-soft text-forest">
        <span className="font-serif text-[1.6rem] leading-none">
          {new Intl.DateTimeFormat("ru-RU", { day: "numeric", timeZone: "Europe/Moscow" }).format(
            new Date(session.startsAt),
          )}
        </span>
        <span className="mt-1 text-[10px] uppercase tracking-[0.14em]">
          {new Intl.DateTimeFormat("ru-RU", { month: "short", timeZone: "Europe/Moscow" })
            .format(new Date(session.startsAt))
            .replace(".", "")}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.12em] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDate(session.startsAt, { weekday: "short", day: "numeric", month: "long" })}
          </span>
          <span>{formatTime(session.startsAt)} МСК</span>
          <span>{session.durationMinutes} мин</span>
        </div>
        <h3 className="mt-1.5 text-[1.0625rem] leading-snug">{session.title}</h3>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {seatsLeft > 0 ? `Свободно ${seatsLeft} из ${session.capacity}` : "Мест нет"}
          </span>
          <span>{session.teacherName}</span>
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </article>
  );
}

export function ReviewCard({
  name,
  note,
  text,
  className,
}: {
  name: string;
  note?: string | null;
  text: string;
  className?: string;
}) {
  return (
    <figure className={cn("flex h-full flex-col justify-between gap-6 border-t border-line pt-5", className)}>
      <blockquote className="text-[15px] leading-relaxed text-[#4b4e46]">«{text}»</blockquote>
      <figcaption className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-sand-soft font-serif text-sm text-forest">
          {name.slice(0, 1)}
        </span>
        <span>
          <span className="block text-sm font-medium text-ink">{name}</span>
          {note ? <span className="block text-xs text-muted">{note}</span> : null}
        </span>
      </figcaption>
    </figure>
  );
}

export function PracticeRow({
  practice,
  index = 0,
  href,
  tone,
}: {
  practice: PracticeLike;
  index?: number;
  href: string;
  tone?: CoverTone;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-transparent p-2 transition-colors hover:border-line hover:bg-paper"
    >
      <div className="relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-lg">
        <PracticeCover tone={tone ?? practice.coverTone} variant={index} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink group-hover:text-forest">{practice.title}</p>
        <p className="mt-0.5 text-xs text-muted">
          {practice.durationMinutes} мин · {difficultyLabel(practice.difficulty)}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-forest" />
    </Link>
  );
}

export function RecentRow({
  title,
  subtitle,
  date,
  href,
  index = 0,
  tone,
}: {
  title: string;
  subtitle: string;
  date: string;
  href: string;
  index?: number;
  tone?: CoverTone;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 border-b border-line py-3 last:border-0"
    >
      <div className="relative aspect-square w-12 shrink-0 overflow-hidden rounded-lg">
        <PracticeCover tone={tone ?? "sand"} variant={index} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink group-hover:text-forest">{title}</p>
        <p className="truncate text-xs text-muted">{subtitle}</p>
      </div>
      <span className="shrink-0 text-xs text-muted">{relativeDays(date)}</span>
    </Link>
  );
}

export function CoverImage({
  src,
  alt,
  className,
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}
