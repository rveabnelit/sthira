"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Badge, Eyebrow } from "@/components/ui/primitives";
import { formatDate } from "@/lib/format";

type Document = {
  id: string;
  slug: string;
  title: string;
  category: string;
  content: string;
  status: "draft" | "published";
  updated_at: string;
};

type Answer = { answer: string; citations: { title: string; href: string }[]; safety: boolean; practices: { title: string }[] };

const EMPTY = { title: "", category: "Методика", content: "", status: "draft" as "draft" | "published" };

export function GuideAdmin({
  documents,
  stats,
}: {
  documents: Document[];
  stats: { totalMessages: number; today: number; conversations: number };
}) {
  const [selected, setSelected] = useState<Document | null>(documents[0] ?? null);
  const [form, setForm] = useState(selected ? { ...selected } : { ...EMPTY });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  const [question, setQuestion] = useState("Я пропустил неделю. С чего вернуться?");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [testing, setTesting] = useState(false);

  function pick(document: Document | null) {
    setSelected(document);
    setForm(document ? { ...document } : { ...EMPTY });
    setError(null);
  }

  async function save() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(
        selected ? `/api/v1/admin/guide-documents/${selected.id}` : "/api/v1/admin/guide-documents",
        {
          method: selected ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title,
            category: form.category,
            content: form.content,
            status: form.status,
          }),
        },
      );
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setError(json?.error?.message ?? "Не удалось сохранить материал.");
        return;
      }
      toast.push("Материал сохранён. Обновление индекса не требуется — поиск выполняется по тексту.", "success");
      router.refresh();
      if (!selected && json.data?.id) {
        setSelected({ ...form, id: json.data.id, slug: json.data.slug, updated_at: new Date().toISOString() } as Document);
      }
    } catch {
      setError("Нет соединения.");
    } finally {
      setPending(false);
    }
  }

  async function unpublish() {
    if (!selected) return;
    setPending(true);
    try {
      await fetch(`/api/v1/admin/guide-documents/${selected.id}`, { method: "DELETE" });
      toast.push("Материал исключён из базы знаний.", "success");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function test() {
    setTesting(true);
    setAnswer(null);
    try {
      const response = await fetch("/api/v1/admin/guide/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        toast.push(json?.error?.message ?? "Не удалось получить ответ.", "error");
        return;
      }
      setAnswer(json.data);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div>
      <header>
        <h1 className="font-serif text-[1.9rem] leading-tight">База знаний STHIRA Guide</h1>
        <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted">
          Ответы Guide строятся только по опубликованным материалам. Индекс событий не требуется: поиск
          выполняется по тексту с нормализацией и ранжированием.
        </p>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-muted">
        <Badge>{documents.length} материалов</Badge>
        <Badge>{documents.filter((doc) => doc.status === "published").length} опубликовано</Badge>
        <span>{stats.totalMessages} вопросов · {stats.conversations} диалогов · {stats.today} сегодня</span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="surface p-3">
          <button
            type="button"
            onClick={() => pick(null)}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-[#cfc9bc] px-3 py-2 text-[11.5px] text-[#565950] hover:border-forest hover:text-forest"
          >
            <Plus className="h-3.5 w-3.5" />
            Новый материал
          </button>
          <ul className="mt-2 max-h-[460px] space-y-0.5 overflow-y-auto">
            {documents.map((document) => (
              <li key={document.id}>
                <button
                  type="button"
                  onClick={() => pick(document)}
                  className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                    selected?.id === document.id ? "bg-[#f0ece3]" : "hover:bg-[#f7f3ea]"
                  }`}
                >
                  <span className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
                    <span className="min-w-0">
                      <span className="block truncate text-[11.5px] text-ink">{document.title}</span>
                      <span className="mt-0.5 block text-[10px] text-muted">
                        {document.category} · {document.status === "published" ? "опубликован" : "черновик"}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="space-y-4">
          <section className="surface p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="doc-title" className="label">
                  Название
                </label>
                <input
                  id="doc-title"
                  className="input"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="doc-category" className="label">
                  Категория
                </label>
                <input
                  id="doc-category"
                  className="input"
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="doc-status" className="label">
                  Статус
                </label>
                <select
                  id="doc-status"
                  className="select"
                  value={form.status}
                  onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as "draft" | "published" }))}
                >
                  <option value="draft">Черновик</option>
                  <option value="published">Опубликован</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="doc-content" className="label">
                  Содержание
                </label>
                <textarea
                  id="doc-content"
                  className="textarea"
                  rows={9}
                  value={form.content}
                  onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                />
                <p className="hint">
                  Пишите так, как объясняли бы ученику. Guide цитирует фрагменты и ссылается на материал.
                </p>
              </div>
            </div>

            {error ? <p className="field-error">{error}</p> : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button type="button" onClick={save} disabled={pending} className="btn btn-primary btn-sm">
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Сохранить
              </button>
              {selected ? (
                <button type="button" onClick={unpublish} disabled={pending || selected.status !== "published"} className="btn btn-secondary btn-sm">
                  <Trash2 className="h-3.5 w-3.5" />
                  Исключить из базы
                </button>
              ) : null}
              {selected ? (
                <span className="text-[10.5px] text-muted">
                  обновлён {formatDate(selected.updated_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              ) : null}
            </div>
          </section>

          <section className="surface p-5">
            <Eyebrow>Проверка ответов</Eyebrow>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              Тестовый вопрос не сохраняется в историю и не расходует лимит ученика.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                className="input flex-1"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                aria-label="Тестовый вопрос"
              />
              <button type="button" onClick={test} disabled={testing} className="btn btn-secondary btn-sm shrink-0">
                {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Проверить
              </button>
            </div>

            {answer ? (
              <div className="mt-4 rounded-xl border border-line bg-[#f7f3ea] p-4">
                <p className="whitespace-pre-line text-[12px] leading-relaxed text-[#3f423b]">{answer.answer}</p>
                {answer.citations.length ? (
                  <p className="mt-2 text-[10.5px] text-muted">
                    Источники: {answer.citations.map((citation) => citation.title).join(" · ")}
                  </p>
                ) : null}
                {answer.safety ? <Badge tone="sand" className="mt-2">Сработала защита по здоровью</Badge> : null}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
