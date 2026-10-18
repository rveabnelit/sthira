"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { DURATION_FILTERS, DIFFICULTIES, GOALS } from "@/content/catalog";
import { cn } from "@/lib/cn";

type Option = { value: string; label: string };

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-[12px] transition-colors",
        active
          ? "border-forest bg-forest text-ivory"
          : "border-line bg-paper text-[#565950] hover:border-[#c9c3b6]",
      )}
    >
      {children}
    </button>
  );
}

export function PracticeFilters({
  total,
  tags,
  basePath = "/practice",
  showAvailability = false,
  currentPlanRank = 0,
}: {
  total: number;
  tags: { tag: string; count: number }[];
  basePath?: string;
  showAvailability?: boolean;
  currentPlanRank?: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const q = params.get("q") ?? "";
  const goal = params.get("goal") ?? "";
  const difficulty = params.get("difficulty") ?? "";
  const duration = params.get("duration") ?? "";
  const tag = params.get("tag") ?? "";
  const plan = params.get("plan") ?? "";
  const sort = params.get("sort") ?? "recommended";
  const hasFilters = Boolean(q || goal || difficulty || duration || tag || plan);

  function update(next: Record<string, string | null>) {
    const search = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (!value) search.delete(key);
      else search.set(key, value);
    });
    const query = search.toString();
    startTransition(() => {
      router.push(query ? `${basePath}?${query}` : basePath, { scroll: false });
    });
  }

  const setExclusive = (key: string, value: string) => update({ [key]: params.get(key) === value ? null : value });

  return (
    <div className="space-y-4" aria-busy={pending}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <form
          action={basePath}
          className="relative flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            const value = new FormData(event.currentTarget).get("q");
            update({ q: typeof value === "string" && value.trim() ? value.trim() : null });
          }}
        >
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Поиск по названию, описанию или тегу"
            aria-label="Поиск практик"
            className="input h-11 pl-10 pr-20 text-[13.5px]"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 inline-flex h-8 -translate-y-1/2 items-center rounded-lg bg-forest px-3 text-[12px] font-medium text-ivory transition-colors hover:bg-forest-deep"
          >
            Найти
          </button>
        </form>

        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="sr-only">
            Сортировка
          </label>
          <select
            id="sort"
            className="select h-11 w-auto min-w-[9.5rem] text-[13px]"
            value={sort}
            onChange={(event) => update({ sort: event.target.value === "recommended" ? null : event.target.value })}
          >
            <option value="recommended">Рекомендуемые</option>
            <option value="newest">Сначала новые</option>
            <option value="popular">Популярные</option>
            <option value="shortest">Сначала короткие</option>
          </select>
          {hasFilters ? (
            <button
              type="button"
              onClick={() => startTransition(() => router.push(basePath, { scroll: false }))}
              className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-line bg-paper px-3 text-[12px] text-[#565950] transition-colors hover:border-forest/30 hover:text-forest"
            >
              <X className="h-3.5 w-3.5" />
              Сбросить
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="hidden pt-1.5 sm:block">
          <SlidersHorizontal className="h-4 w-4 text-muted" />
        </div>
        <div className="scrollbar-hide -mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1 pb-1">
          <Chip active={!goal} onClick={() => update({ goal: null })}>
            Любая цель
          </Chip>
          {GOALS.map((item) => (
            <Chip key={item.value} active={goal === item.value} onClick={() => setExclusive("goal", item.value)}>
              {item.short}
            </Chip>
          ))}
          <span className="mx-1 h-8 w-px shrink-0 bg-line" aria-hidden="true" />
          <Chip active={!duration} onClick={() => update({ duration: null })}>
            Любая длительность
          </Chip>
          {DURATION_FILTERS.map((item) => (
            <Chip
              key={item.value}
              active={duration === item.value}
              onClick={() => setExclusive("duration", item.value)}
            >
              {item.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="scrollbar-hide -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {DIFFICULTIES.map((item) => (
          <Chip
            key={item.value}
            active={difficulty === item.value}
            onClick={() => setExclusive("difficulty", item.value)}
          >
            {item.label}
          </Chip>
        ))}
        {showAvailability ? (
          <>
            <span className="mx-1 h-8 w-px shrink-0 bg-line" aria-hidden="true" />
            <Chip active={plan === "available"} onClick={() => setExclusive("plan", "available")}>
              Доступно по тарифу
            </Chip>
            <Chip active={plan === "guide"} onClick={() => setExclusive("plan", "guide")}>
              Только Guide и выше
            </Chip>
          </>
        ) : null}
        {tags.slice(0, 8).map((item) => (
          <Chip key={item.tag} active={tag === item.tag} onClick={() => setExclusive("tag", item.tag)}>
            {item.tag}
          </Chip>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <p className="text-[12px] text-muted">
          {total} {total % 10 === 1 && total % 100 !== 11 ? "практика" : "практик"}
          {hasFilters ? " по выбранным фильтрам" : ""}
        </p>
        {currentPlanRank === 0 && showAvailability ? (
          <p className="text-[11.5px] text-muted">Часть практик открывается по подписке</p>
        ) : null}
      </div>
    </div>
  );
}
