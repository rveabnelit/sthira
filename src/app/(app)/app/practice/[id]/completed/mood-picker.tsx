"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

const MOODS = ["легко", "спокойно", "бодро", "устал(а)", "было сложно"];

export function MoodPicker({ completionId, initial }: { completionId: string; initial: string | null }) {
  const [mood, setMood] = useState<string | null>(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose(value: string) {
    const next = mood === value ? null : value;
    setMood(next);
    setError(null);
    try {
      const response = await fetch(`/api/v1/completions/${completionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: next }),
      });
      if (!response.ok) {
        setError("Не удалось сохранить самочувствие.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Нет соединения. Отметка не сохранена.");
    }
  }

  return (
    <section className="surface mt-4 p-5">
      <div className="flex items-center justify-between">
        <p className="text-[12.5px] font-medium text-ink">Как вы себя чувствуете?</p>
        <span className="text-[10.5px] text-muted">Необязательно</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {MOODS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => choose(item)}
            aria-pressed={mood === item}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[12px] transition-colors",
              mood === item
                ? "border-forest bg-forest text-ivory"
                : "border-line bg-paper text-[#565950] hover:border-[#c9c3b6]",
            )}
          >
            {item}
          </button>
        ))}
      </div>
      {saved ? (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#3f5a43]">
          <Check className="h-3.5 w-3.5" />
          Отмечено
        </p>
      ) : null}
      {error ? <p className="field-error">{error}</p> : null}
      <p className="mt-3 text-[10.5px] leading-relaxed text-muted">
        Самочувствие видно только вам и используется для подбора практик. Это не медицинская оценка.
      </p>
    </section>
  );
}
