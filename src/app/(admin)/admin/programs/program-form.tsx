"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUp, Loader2, Plus, Save, Trash2 } from "lucide-react";
import type { Program } from "@/lib/types";
import type { CoverTone } from "@/content/catalog";
import { DIFFICULTIES } from "@/content/catalog";
import { PracticeCover } from "@/components/covers/practice-cover";
import { useToast } from "@/components/ui/toast";

type LessonDraft = { title: string; practiceId: string };
type ModuleDraft = { title: string; description: string; lessons: LessonDraft[] };

export function ProgramForm({
  program,
  practices,
  initialModules,
}: {
  program?: Program;
  practices: { id: string; title: string; durationMinutes: number; difficulty: string }[];
  initialModules?: { title: string; description: string | null; lessons: { title: string; practiceId: string }[] }[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: program?.title ?? "",
    slug: program?.slug ?? "",
    shortDescription: program?.shortDescription ?? "",
    description: program?.description ?? "",
    difficulty: program?.difficulty ?? ("beginner" as "beginner" | "intermediate" | "advanced"),
    estimatedDuration: program?.estimatedDuration ?? "3 недели",
    lessonsPerWeek: program?.lessonsPerWeek ?? 3,
    audience: program?.audience ?? "",
    outcomes: (program?.outcomes ?? []).join("\n"),
    requiredPlan: program?.requiredPlan ?? ("practice" as "practice" | "guide" | "live"),
    status: program?.status ?? ("draft" as "draft" | "published" | "archived"),
    coverTone: program?.coverTone ?? ("sage" as CoverTone),
  });
  const [modules, setModules] = useState<ModuleDraft[]>(
    initialModules?.length
      ? initialModules.map((module) => ({
          title: module.title,
          description: module.description ?? "",
          lessons: module.lessons.map((lesson) => ({ title: lesson.title, practiceId: lesson.practiceId })),
        }))
      : [
          {
            title: "Неделя 1",
            description: "",
            lessons: [{ title: "", practiceId: practices[0]?.id ?? "" }],
          },
        ],
  );

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateModule(index: number, patch: Partial<ModuleDraft>) {
    setModules((prev) => prev.map((module, i) => (i === index ? { ...module, ...patch } : module)));
  }

  function updateLesson(moduleIndex: number, lessonIndex: number, patch: Partial<LessonDraft>) {
    setModules((prev) =>
      prev.map((module, i) =>
        i === moduleIndex
          ? { ...module, lessons: module.lessons.map((lesson, j) => (j === lessonIndex ? { ...lesson, ...patch } : lesson)) }
          : module,
      ),
    );
  }

  function moveModule(index: number, direction: -1 | 1) {
    setModules((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function moveLesson(moduleIndex: number, lessonIndex: number, direction: -1 | 1) {
    setModules((prev) =>
      prev.map((module, i) => {
        if (i !== moduleIndex) return module;
        const next = [...module.lessons];
        const target = lessonIndex + direction;
        if (target < 0 || target >= next.length) return module;
        [next[lessonIndex], next[target]] = [next[target], next[lessonIndex]];
        return { ...module, lessons: next };
      }),
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const payload = {
      title: form.title,
      slug: form.slug || undefined,
      shortDescription: form.shortDescription,
      description: form.description,
      coverTone: form.coverTone,
      difficulty: form.difficulty,
      estimatedDuration: form.estimatedDuration,
      lessonsPerWeek: Number(form.lessonsPerWeek),
      audience: form.audience || null,
      outcomes: form.outcomes
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      requiredPlan: form.requiredPlan,
      status: form.status,
      modules: modules.map((module) => ({
        title: module.title,
        description: module.description || null,
        lessons: module.lessons.map((lesson) => ({ title: lesson.title, practiceId: lesson.practiceId })),
      })),
    };

    try {
      const response = await fetch(program ? `/api/v1/admin/programs/${program.id}` : "/api/v1/admin/programs", {
        method: program ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setError(json?.error?.message ?? "Не удалось сохранить программу.");
        return;
      }
      toast.push("Программа сохранена.", "success");
      router.push("/admin/programs");
      router.refresh();
    } catch {
      setError("Нет соединения. Данные не сохранены.");
    } finally {
      setPending(false);
    }
  }

  const totalLessons = modules.reduce((acc, module) => acc + module.lessons.length, 0);

  return (
    <form onSubmit={onSubmit} className="grid gap-5 lg:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        <section className="surface p-5">
          <h2 className="text-[11px] uppercase tracking-[0.14em] text-muted">Описание программы</h2>
          <div className="mt-4 grid gap-4">
            <div>
              <label htmlFor="title" className="label">
                Название
              </label>
              <input id="title" className="input" value={form.title} onChange={(e) => set("title", e.target.value)} required minLength={3} />
            </div>
            <div>
              <label htmlFor="slug" className="label">
                URL-идентификатор
              </label>
              <input id="slug" className="input" value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="генерируется автоматически" />
            </div>
            <div>
              <label htmlFor="shortDescription" className="label">
                Краткое описание
              </label>
              <input
                id="shortDescription"
                className="input"
                value={form.shortDescription}
                onChange={(e) => set("shortDescription", e.target.value)}
                required
                minLength={5}
                maxLength={240}
              />
            </div>
            <div>
              <label htmlFor="description" className="label">
                Полное описание
              </label>
              <textarea
                id="description"
                className="textarea"
                rows={5}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                required
                minLength={20}
              />
            </div>
            <div>
              <label htmlFor="audience" className="label">
                Для кого
              </label>
              <textarea id="audience" className="textarea" rows={2} value={form.audience} onChange={(e) => set("audience", e.target.value)} />
            </div>
            <div>
              <label htmlFor="outcomes" className="label">
                Чему посвящена (по одному пункту на строку)
              </label>
              <textarea id="outcomes" className="textarea" rows={3} value={form.outcomes} onChange={(e) => set("outcomes", e.target.value)} />
            </div>
          </div>
        </section>

        <section className="surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] uppercase tracking-[0.14em] text-muted">Структура</h2>
            <span className="text-[10.5px] text-muted">
              {modules.length} модулей · {totalLessons} уроков
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {modules.map((module, moduleIndex) => (
              <div key={moduleIndex} className="rounded-xl border border-line bg-[#faf7f0] p-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.12em] text-muted">Модуль {moduleIndex + 1}</span>
                  <div className="ml-auto flex items-center gap-1">
                    <button type="button" onClick={() => moveModule(moduleIndex, -1)} aria-label="Выше" className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-paper hover:text-forest">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => moveModule(moduleIndex, 1)} aria-label="Ниже" className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-paper hover:text-forest">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setModules((prev) => prev.filter((_, i) => i !== moduleIndex))}
                      aria-label="Удалить модуль"
                      className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-paper hover:text-[#8a3d2f]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <input
                  className="input mt-2 h-9 text-[12.5px]"
                  value={module.title}
                  onChange={(e) => updateModule(moduleIndex, { title: e.target.value })}
                  placeholder="Название модуля"
                  required
                />
                <input
                  className="input mt-1.5 h-9 text-[12px]"
                  value={module.description}
                  onChange={(e) => updateModule(moduleIndex, { description: e.target.value })}
                  placeholder="Короткое описание (необязательно)"
                />

                <div className="mt-3 space-y-1.5">
                  {module.lessons.map((lesson, lessonIndex) => (
                    <div key={lessonIndex} className="flex flex-col gap-1.5 rounded-lg border border-line bg-paper p-2 sm:flex-row sm:items-center">
                      <input
                        className="input h-8 flex-1 text-[12px]"
                        value={lesson.title}
                        onChange={(e) => updateLesson(moduleIndex, lessonIndex, { title: e.target.value })}
                        placeholder="Название урока"
                        required
                      />
                      <select
                        className="select h-8 flex-1 text-[11.5px]"
                        value={lesson.practiceId}
                        onChange={(e) => updateLesson(moduleIndex, lessonIndex, { practiceId: e.target.value })}
                        aria-label="Практика урока"
                      >
                        {practices.map((practice) => (
                          <option key={practice.id} value={practice.id}>
                            {practice.title} · {practice.durationMinutes} мин
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => moveLesson(moduleIndex, lessonIndex, -1)} aria-label="Выше" className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-[#f2ede3]">
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button type="button" onClick={() => moveLesson(moduleIndex, lessonIndex, 1)} aria-label="Ниже" className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-[#f2ede3]">
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateModule(moduleIndex, { lessons: module.lessons.filter((_, i) => i !== lessonIndex) })
                          }
                          aria-label="Удалить урок"
                          className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-[#f2ede3] hover:text-[#8a3d2f]"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      updateModule(moduleIndex, {
                        lessons: [...module.lessons, { title: "", practiceId: practices[0]?.id ?? "" }],
                      })
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-forest"
                  >
                    <Plus className="h-3 w-3" /> Добавить урок
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setModules((prev) => [...prev, { title: "", description: "", lessons: [{ title: "", practiceId: practices[0]?.id ?? "" }] }])}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#cfc9bc] px-3 py-2 text-[11.5px] text-[#565950] hover:border-forest hover:text-forest"
            >
              <Plus className="h-3.5 w-3.5" /> Добавить модуль
            </button>
          </div>
        </section>

        <section className="surface p-5">
          <h2 className="text-[11px] uppercase tracking-[0.14em] text-muted">Параметры</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="difficulty" className="label">
                Уровень
              </label>
              <select id="difficulty" className="select" value={form.difficulty} onChange={(e) => set("difficulty", e.target.value as typeof form.difficulty)}>
                {DIFFICULTIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="estimatedDuration" className="label">
                Длительность
              </label>
              <input id="estimatedDuration" className="input" value={form.estimatedDuration} onChange={(e) => set("estimatedDuration", e.target.value)} />
            </div>
            <div>
              <label htmlFor="lessonsPerWeek" className="label">
                Уроков в неделю
              </label>
              <input
                id="lessonsPerWeek"
                type="number"
                min={1}
                max={7}
                className="input"
                value={form.lessonsPerWeek}
                onChange={(e) => set("lessonsPerWeek", Number(e.target.value))}
              />
            </div>
            <div>
              <label htmlFor="requiredPlan" className="label">
                Доступ по тарифу
              </label>
              <select id="requiredPlan" className="select" value={form.requiredPlan} onChange={(e) => set("requiredPlan", e.target.value as typeof form.requiredPlan)}>
                <option value="practice">Practice и выше</option>
                <option value="guide">Guide и выше</option>
                <option value="live">Live</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <p className="label">Статус</p>
              <div className="flex flex-wrap gap-2">
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
                      form.status === option.value ? "border-forest bg-forest text-ivory" : "border-line bg-paper text-[#565950]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {error ? <p className="field-error">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {pending ? "Сохраняем…" : "Сохранить программу"}
          </button>
          <Link href="/admin/programs" className="btn btn-secondary">
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Link>
        </div>
      </div>

      <aside className="lg:sticky lg:top-20 lg:h-fit">
        <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-muted">Предпросмотр</p>
        <div className="surface overflow-hidden">
          <div className="relative aspect-[16/10]">
            <PracticeCover tone={form.coverTone} label={form.title || "Новая программа"} />
          </div>
          <div className="p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
              {form.estimatedDuration} · {totalLessons} уроков
            </p>
            <p className="mt-1 font-serif text-[1.2rem] leading-snug">{form.title || "Название программы"}</p>
            <p className="mt-1.5 line-clamp-3 text-[11.5px] leading-relaxed text-muted">
              {form.shortDescription || "Краткое описание появится здесь."}
            </p>
          </div>
        </div>
        <p className="mt-3 text-[10.5px] leading-relaxed text-muted">
          Порядок модулей и уроков сохраняется в том виде, в котором он указан в форме.
        </p>
      </aside>
    </form>
  );
}
