"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function NewSessionForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/admin/live-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.get("title"),
          description: data.get("description"),
          startsAt: new Date(String(data.get("startsAt"))).toISOString(),
          durationMinutes: Number(data.get("durationMinutes")),
          capacity: Number(data.get("capacity")),
          joinUrl: data.get("joinUrl") || null,
          status: "scheduled",
        }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setError(json?.error?.message ?? "Не удалось создать занятие.");
        return;
      }
      toast.push("Занятие добавлено в расписание.", "success");
      form.reset();
      router.refresh();
    } catch {
      setError("Нет соединения.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="surface p-5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Новое занятие</p>
      <div className="mt-4 grid gap-3">
        <div>
          <label htmlFor="title" className="label">
            Название
          </label>
          <input id="title" name="title" className="input h-10 text-[12.5px]" required minLength={3} />
        </div>
        <div>
          <label htmlFor="description" className="label">
            Описание
          </label>
          <textarea id="description" name="description" className="textarea text-[12.5px]" rows={3} required minLength={10} />
        </div>
        <div>
          <label htmlFor="startsAt" className="label">
            Дата и время (МСК)
          </label>
          <input id="startsAt" name="startsAt" type="datetime-local" className="input h-10 text-[12.5px]" required />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="durationMinutes" className="label">
              Минут
            </label>
            <input id="durationMinutes" name="durationMinutes" type="number" min={10} max={240} defaultValue={45} className="input h-10 text-[12.5px]" />
          </div>
          <div>
            <label htmlFor="capacity" className="label">
              Мест
            </label>
            <input id="capacity" name="capacity" type="number" min={1} max={500} defaultValue={20} className="input h-10 text-[12.5px]" />
          </div>
        </div>
        <div>
          <label htmlFor="joinUrl" className="label">
            Ссылка на трансляцию
          </label>
          <input id="joinUrl" name="joinUrl" className="input h-10 text-[12px]" placeholder="https://..." />
        </div>
        {error ? <p className="field-error">{error}</p> : null}
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Добавить занятие
        </button>
        <p className="text-[10px] leading-relaxed text-muted">
          Ссылка на трансляцию становится доступной ученикам за 30 минут до начала.
        </p>
      </div>
    </form>
  );
}
