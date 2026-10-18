"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { GOALS, PREFERENCES, type CoverTone } from "@/content/catalog";
import { PracticeCover } from "@/components/covers/practice-cover";
import { cn } from "@/lib/cn";

type Answers = {
  goal: string | null;
  experienceLevel: string | null;
  preferredDuration: string | null;
  preferredTime: string | null;
};

type PracticeResult = {
  id: string;
  title: string;
  durationMinutes: number;
  goal: string;
  coverTone: string;
  slug: string;
};

const STEPS = [
  {
    key: "goal" as const,
    title: "Что для вас важно сейчас?",
    hint: "Можно изменить позже",
    options: GOALS.map((goal) => ({ value: goal.value, label: goal.label })),
    optional: false,
  },
  {
    key: "experienceLevel" as const,
    title: "Какой у вас опыт?",
    hint: "Это влияет на уровень практик",
    options: PREFERENCES.experience,
    optional: false,
  },
  {
    key: "preferredDuration" as const,
    title: "Сколько времени удобно?",
    hint: "Можно пропустить — подберём универсально",
    options: PREFERENCES.duration,
    optional: true,
  },
  {
    key: "preferredTime" as const,
    title: "Когда удобнее заниматься?",
    hint: "Помогает подобрать практики под ритм дня",
    options: PREFERENCES.time,
    optional: true,
  },
];

export function OnboardingWizard({ initial }: { initial: Answers }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initial);
  const [results, setResults] = useState<PracticeResult[] | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const current = STEPS[step];
  const value = answers[current.key];

  function choose(optionValue: string) {
    setAnswers((prev) => ({ ...prev, [current.key]: optionValue }));
  }

  async function finish() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/users/me/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...answers, onboardingCompleted: true }),
      });
      if (!response.ok) {
        const json = await response.json().catch(() => null);
        setError(json?.error?.message ?? "Не удалось сохранить ответы.");
        return;
      }
      const search = new URLSearchParams({ limit: "3" });
      if (answers.goal) search.set("goal", answers.goal);
      if (answers.preferredDuration === "10-15") search.set("duration", "short");
      if (answers.preferredDuration === "20-30") search.set("duration", "medium");
      if (answers.preferredDuration === "40+") search.set("duration", "deep");
      const practices = await fetch(`/api/v1/practices?${search.toString()}`).then((res) => res.json());
      setResults((practices?.data?.practices ?? []).slice(0, 3));
      router.refresh();
    } catch {
      setError("Нет соединения. Попробуйте ещё раз.");
    } finally {
      setPending(false);
    }
  }

  if (results) {
    return (
      <div>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted">
          <Check className="h-3.5 w-3.5 text-[#4f6b52]" />
          Маршрут готов
        </div>
        <h2 className="display-3 mt-3">С чего начать</h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
          Эти практики подходят под вашу цель и доступное время. Начать можно с любой — прогресс сохранится.
        </p>

        <ul className="mt-6 space-y-3">
          {results.map((practice, index) => (
            <li key={practice.id}>
              <Link
                href={`/app/practice/${practice.id}`}
                className="group flex items-center gap-4 rounded-[16px] border border-line bg-paper p-3 transition-colors hover:border-sage"
              >
                <span className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-xl">
                  <PracticeCover tone={practice.coverTone as CoverTone} variant={index} number={`0${index + 1}`} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-[1.15rem] leading-snug text-ink group-hover:text-forest">
                    {practice.title}
                  </span>
                  <span className="mt-1 block text-[11.5px] text-muted">{practice.durationMinutes} минут</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted" />
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Link href="/app" className="btn btn-secondary">
            Перейти на главную
          </Link>
          <Link href={results[0] ? `/app/practice/${results[0].id}` : "/app/practice"} className="btn btn-primary">
            Начать первую практику
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <p className="mt-4 text-center text-[11px] text-muted">
          Ответы сохранены в настройках профиля. Их можно изменить в любой момент.
        </p>
      </div>
    );
  }

  const isLast = step === STEPS.length - 1;

  return (
    <div className="surface p-6 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5" aria-hidden="true">
          {STEPS.map((_, index) => (
            <span
              key={index}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === step ? "w-7 bg-forest" : index < step ? "w-4 bg-sage" : "w-4 bg-[#e4e0d5]",
              )}
            />
          ))}
        </div>
        <p className="text-[11px] text-muted">
          Шаг {step + 1} из {STEPS.length}
        </p>
      </div>

      <h2 className="display-3 mt-6">{current.title}</h2>
      <p className="mt-1.5 text-[11.5px] text-muted">{current.hint}</p>

      <div className="mt-5 grid gap-2">
        {current.options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => choose(option.value)}
              aria-pressed={active}
              className={cn(
                "flex items-center justify-between gap-4 rounded-xl border px-4 py-3.5 text-left text-[13.5px] transition-colors",
                active
                  ? "border-forest bg-[#f1f4ec] text-forest"
                  : "border-line bg-paper text-[#4d5048] hover:border-[#c9c3b6]",
              )}
            >
              {option.label}
              <span
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                  active ? "border-forest bg-forest text-ivory" : "border-[#cfc9bc]",
                )}
              >
                {active ? <Check className="h-3 w-3" /> : null}
              </span>
            </button>
          );
        })}
      </div>

      {error ? <p className="field-error mt-3">{error}</p> : null}

      <div className="mt-6 flex items-center justify-between gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((value) => value - 1)}
            className="inline-flex items-center gap-1.5 text-[12.5px] text-muted hover:text-forest"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Назад
          </button>
        ) : (
          <Link href="/app" className="inline-flex items-center gap-1.5 text-[12.5px] text-muted hover:text-forest">
            Пропустить
          </Link>
        )}

        <div className="flex items-center gap-3">
          {current.optional && !isLast ? (
            <button
              type="button"
              onClick={() => setStep((value) => value + 1)}
              className="text-[12px] text-muted hover:text-forest"
            >
              Пропустить
            </button>
          ) : null}
          {isLast ? (
            <button type="button" onClick={finish} disabled={pending} className="btn btn-primary btn-sm">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {pending ? "Сохраняем…" : "Показать маршрут"}
              {!pending ? <ArrowRight className="h-3.5 w-3.5" /> : null}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep((value) => value + 1)}
              disabled={!value && !current.optional}
              className="btn btn-primary btn-sm"
            >
              Далее
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
