"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import type { Practice } from "@/lib/types";
import type { CoverTone } from "@/content/catalog";
import { DIFFICULTIES, GOALS } from "@/content/catalog";
import { PracticeCover } from "@/components/covers/practice-cover";
import { difficultyLabel, formatMinutes, goalLabel } from "@/lib/format";
import { useToast } from "@/components/ui/toast";

type FormState = {
  title: string;
  slug: string;
  description: string;
  teacherNote: string;
  thumbnailUrl: string;
  coverTone: CoverTone;
  videoProvider: "mock" | "external";
  videoUrl: string;
  videoAssetId: string;
  durationMinutes: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  goal: "start" | "habit" | "movement" | "deepen";
  tags: string;
  requiredPlan: "practice" | "guide" | "live";
  status: "draft" | "published" | "archived";
};

const TONES: CoverTone[] = ["sand", "sage", "forest", "clay", "ivory"];

export function PracticeForm({ practice }: { practice?: Practice }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    title: practice?.title ?? "",
    slug: practice?.slug ?? "",
    description: practice?.description ?? "",
    teacherNote: practice?.teacherNote ?? "",
    thumbnailUrl: practice?.thumbnailUrl ?? "",
    coverTone: practice?.coverTone ?? "sand",
    videoProvider: practice?.videoProvider === "external" ? "external" : "mock",
    videoUrl: practice?.videoUrl ?? "",
    videoAssetId: practice?.videoAssetId ?? "",
    durationMinutes: practice?.durationMinutes ?? 20,
    difficulty: practice?.difficulty ?? "beginner",
    goal: practice?.goal ?? "start",
    tags: practice?.tags.join(", ") ?? "",
    requiredPlan: practice?.requiredPlan ?? "practice",
    status: practice?.status ?? "draft",
  });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const payload = {
      title: form.title,
      slug: form.slug || undefined,
      description: form.description,
      teacherNote: form.teacherNote || null,
      thumbnailUrl: form.thumbnailUrl || null,
      coverTone: form.coverTone,
      videoProvider: form.videoProvider,
      videoUrl: form.videoUrl || null,
      videoAssetId: form.videoAssetId || null,
      durationMinutes: Number(form.durationMinutes),
      difficulty: form.difficulty,
      goal: form.goal,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      requiredPlan: form.requiredPlan,
      status: form.status,
    };

    try {
      const response = await fetch(
        practice ? `/api/v1/admin/practices/${practice.id}` : "/api/v1/admin/practices",
        {
          method: practice ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setError(json?.error?.message ?? "Не удалось сохранить практику.");
        return;
      }
      toast.push("Практика сохранена.", "success");
      router.push("/admin/practices");
      router.refresh();
    } catch {
      setError("Нет соединения. Данные не сохранены.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <section className="surface p-5">
          <h2 className="text-[11px] uppercase tracking-[0.14em] text-muted">Основное</h2>
          <div className="mt-4 grid gap-4">
            <div>
              <label htmlFor="title" className="label">
                Название
              </label>
              <input
                id="title"
                className="input"
                value={form.title}
                onChange={(event) => set("title", event.target.value)}
                required
                minLength={3}
                maxLength={120}
              />
            </div>
            <div>
              <label htmlFor="slug" className="label">
                URL-идентификатор
              </label>
              <input
                id="slug"
                className="input"
                value={form.slug}
                onChange={(event) => set("slug", event.target.value)}
                placeholder="генерируется из названия"
              />
              <p className="hint">Латиница, цифры и дефис. Должен быть уникальным.</p>
            </div>
            <div>
              <label htmlFor="description" className="label">
                Описание
              </label>
              <textarea
                id="description"
                className="textarea"
                value={form.description}
                onChange={(event) => set("description", event.target.value)}
                required
                minLength={10}
                rows={5}
              />
            </div>
            <div>
              <label htmlFor="teacherNote" className="label">
                Рекомендация преподавателя
              </label>
              <textarea
                id="teacherNote"
                className="textarea"
                value={form.teacherNote}
                onChange={(event) => set("teacherNote", event.target.value)}
                rows={3}
                placeholder="Например: держите колени мягкими, не форсируйте наклон"
              />
            </div>
          </div>
        </section>

        <section className="surface p-5">
          <h2 className="text-[11px] uppercase tracking-[0.14em] text-muted">Параметры занятия</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="duration" className="label">
                Длительность, мин
              </label>
              <input
                id="duration"
                type="number"
                min={3}
                max={180}
                className="input"
                value={form.durationMinutes}
                onChange={(event) => set("durationMinutes", Number(event.target.value))}
              />
            </div>
            <div>
              <label htmlFor="difficulty" className="label">
                Уровень
              </label>
              <select
                id="difficulty"
                className="select"
                value={form.difficulty}
                onChange={(event) => set("difficulty", event.target.value as FormState["difficulty"])}
              >
                {DIFFICULTIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="goal" className="label">
                Цель
              </label>
              <select
                id="goal"
                className="select"
                value={form.goal}
                onChange={(event) => set("goal", event.target.value as FormState["goal"])}
              >
                {GOALS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="requiredPlan" className="label">
                Доступ по тарифу
              </label>
              <select
                id="requiredPlan"
                className="select"
                value={form.requiredPlan}
                onChange={(event) => set("requiredPlan", event.target.value as FormState["requiredPlan"])}
              >
                <option value="practice">Practice и выше</option>
                <option value="guide">Guide и выше</option>
                <option value="live">Live</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="tags" className="label">
                Теги
              </label>
              <input
                id="tags"
                className="input"
                value={form.tags}
                onChange={(event) => set("tags", event.target.value)}
                placeholder="утро, спина, мягкая практика"
              />
              <p className="hint">Через запятую. По тегам работает фильтр в каталоге.</p>
            </div>
          </div>
        </section>

        <section className="surface p-5">
          <h2 className="text-[11px] uppercase tracking-[0.14em] text-muted">Видео и обложка</h2>
          <div className="mt-4 grid gap-4">
            <div>
              <label htmlFor="videoProvider" className="label">
                Видеопровайдер
              </label>
              <select
                id="videoProvider"
                className="select"
                value={form.videoProvider}
                onChange={(event) => set("videoProvider", event.target.value as FormState["videoProvider"])}
              >
                <option value="mock">Демо-плеер (без видеопотока)</option>
                <option value="external">Прямая ссылка на видео (mp4 / HLS)</option>
              </select>
              <p className="hint">
                В MVP используется внешний видеохостинг. Ссылки закрытых видео выдаются с учётом доступа.
              </p>
            </div>
            {form.videoProvider === "external" ? (
              <div>
                <label htmlFor="videoUrl" className="label">
                  Ссылка на видео
                </label>
                <input
                  id="videoUrl"
                  className="input"
                  value={form.videoUrl}
                  onChange={(event) => set("videoUrl", event.target.value)}
                  placeholder="https://..."
                />
              </div>
            ) : null}
            <div>
              <label htmlFor="thumbnailUrl" className="label">
                Обложка (URL)
              </label>
              <input
                id="thumbnailUrl"
                className="input"
                value={form.thumbnailUrl}
                onChange={(event) => set("thumbnailUrl", event.target.value)}
                placeholder="/images/... или https://..."
              />
              <p className="hint">Если не заполнена, используется типографическая обложка школы.</p>
            </div>
            <div>
              <p className="label">Тон обложки</p>
              <div className="flex flex-wrap gap-2">
                {TONES.map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => set("coverTone", tone)}
                    aria-pressed={form.coverTone === tone}
                    className={`h-9 w-14 overflow-hidden rounded-lg border-2 transition-all ${
                      form.coverTone === tone ? "border-forest" : "border-transparent"
                    }`}
                  >
                    <PracticeCover tone={tone} variant={0} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="surface p-5">
          <h2 className="text-[11px] uppercase tracking-[0.14em] text-muted">Публикация</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {(
              [
                { value: "draft", label: "Черновик" },
                { value: "published", label: "Опубликовано" },
                { value: "archived", label: "Архив" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => set("status", option.value)}
                aria-pressed={form.status === option.value}
                className={`rounded-lg border px-3 py-2 text-[12px] transition-colors ${
                  form.status === option.value
                    ? "border-forest bg-forest text-ivory"
                    : "border-line bg-paper text-[#565950]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10.5px] leading-relaxed text-muted">
            Черновик и архив не отображаются в публичном каталоге и в API для учеников.
          </p>
        </section>

        {error ? <p className="field-error">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {pending ? "Сохраняем…" : "Сохранить практику"}
          </button>
          <Link href="/admin/practices" className="btn btn-secondary">
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Link>
        </div>
      </div>

      <aside className="lg:sticky lg:top-20 lg:h-fit">
        <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-muted">Предпросмотр карточки</p>
        <div className="surface overflow-hidden">
          <div className="relative aspect-[4/3]">
            <PracticeCover
              tone={form.coverTone}
              variant={form.title.length}
              number="01"
              label={form.title || "Новая практика"}
            />
            <span className="absolute left-3 top-3 badge bg-white/80 text-ink">
              {form.durationMinutes} мин
            </span>
          </div>
          <div className="p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted">{goalLabel(form.goal)}</p>
            <p className="mt-1 font-serif text-[1.15rem] leading-snug">{form.title || "Название практики"}</p>
            <p className="mt-1 line-clamp-3 text-[11.5px] leading-relaxed text-muted">
              {form.description || "Описание появится здесь."}
            </p>
            <p className="mt-2 text-[10.5px] text-muted">
              {difficultyLabel(form.difficulty)} · {formatMinutes(form.durationMinutes)}
            </p>
          </div>
        </div>
        <p className="mt-3 text-[10.5px] leading-relaxed text-muted">
          Так карточка выглядит в публичном каталоге. Обложка — типографическая или загруженная.
        </p>
      </aside>
    </form>
  );
}
