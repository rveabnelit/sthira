"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, Clock, List, Loader2, Lock, Users } from "lucide-react";
import type { LiveSession } from "@/lib/types";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/toast";

export function ScheduleView({ sessions, hasLive }: { sessions: LiveSession[]; hasLive: boolean }) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  const dayKey = (iso: string) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow", year: "numeric", month: "2-digit", day: "2-digit" }).format(
      new Date(iso),
    );

  const days: { key: string; label: string; weekday: string; sessions: LiveSession[] }[] = [];
  for (let i = 0; i < 14; i++) {
    const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
    const key = dayKey(date.toISOString());
    days.push({
      key,
      label: new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", timeZone: "Europe/Moscow" }).format(date),
      weekday: new Intl.DateTimeFormat("ru-RU", { weekday: "short", timeZone: "Europe/Moscow" }).format(date),
      sessions: sessions.filter((session) => dayKey(session.startsAt) === key),
    });
  }

  const visible = selectedDay ? sessions.filter((session) => dayKey(session.startsAt) === selectedDay) : sessions;

  async function toggleRegistration(session: LiveSession) {
    setPendingId(session.id);
    try {
      const response = await fetch(`/api/v1/live/${session.id}/register`, {
        method: session.registered ? "DELETE" : "POST",
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        toast.push(json?.error?.message ?? "Не удалось изменить запись.", "error");
        return;
      }
      toast.push(session.registered ? "Запись отменена." : "Вы записаны на занятие.", "success");
      router.refresh();
    } catch {
      toast.push("Нет соединения.", "error");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl border border-line bg-paper p-1">
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] transition-colors",
              view === "list" ? "bg-forest text-ivory" : "text-[#565950]",
            )}
          >
            <List className="h-3.5 w-3.5" />
            Список
          </button>
          <button
            type="button"
            onClick={() => setView("calendar")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] transition-colors",
              view === "calendar" ? "bg-forest text-ivory" : "text-[#565950]",
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Календарь
          </button>
        </div>
        <p className="text-[11.5px] text-muted">Ближайшие 14 дней · {sessions.length} занятий</p>
      </div>

      {view === "calendar" ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {days.map((day) => (
            <button
              key={day.key}
              type="button"
              onClick={() => setSelectedDay(selectedDay === day.key ? null : day.key)}
              className={cn(
                "rounded-xl border p-3 text-left transition-colors",
                selectedDay === day.key ? "border-forest bg-[#f1f4ec]" : "border-line bg-paper hover:border-sage",
                day.sessions.length === 0 && "opacity-60",
              )}
            >
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted">{day.weekday}</p>
              <p className="mt-1 font-serif text-[1.1rem]">{day.label}</p>
              {day.sessions.length > 0 ? (
                <p className="mt-1.5 text-[10.5px] text-forest">
                  {day.sessions.length} занят{day.sessions.length === 1 ? "ие" : "ия"}
                </p>
              ) : (
                <p className="mt-1.5 text-[10.5px] text-muted">—</p>
              )}
            </button>
          ))}
        </div>
      ) : null}

      {sessions.length === 0 ? (
        <div className="mt-8 rounded-[16px] border border-line bg-paper p-8 text-center">
          <p className="font-serif text-[1.35rem]">Ближайших занятий нет</p>
          <p className="mx-auto mt-2 max-w-sm text-[12.5px] leading-relaxed text-muted">
            Новое расписание публикуется каждую неделю. Пока можно выбрать практику из библиотеки.
          </p>
          <Link href="/app/practice" className="btn btn-primary btn-sm mt-4">
            К практикам
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <p className="mt-8 rounded-xl border border-line bg-paper p-6 text-center text-[12.5px] text-muted">
          В этот день занятий нет.{" "}
          <button type="button" onClick={() => setSelectedDay(null)} className="text-forest underline">
            Показать все
          </button>
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {visible.map((session) => {
            const seatsLeft = Math.max(0, session.capacity - (session.registrationCount ?? 0));
            return (
              <li key={session.id} className="surface p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-sage-soft text-forest">
                    <span className="font-serif text-[1.5rem] leading-none">
                      {new Intl.DateTimeFormat("ru-RU", { day: "numeric", timeZone: "Europe/Moscow" }).format(new Date(session.startsAt))}
                    </span>
                    <span className="mt-0.5 text-[10px] uppercase tracking-[0.12em]">
                      {new Intl.DateTimeFormat("ru-RU", { month: "short", timeZone: "Europe/Moscow" })
                        .format(new Date(session.startsAt))
                        .replace(".", "")}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.1em] text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {formatTime(session.startsAt)} МСК · {session.durationMinutes} мин
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {seatsLeft > 0 ? `${seatsLeft} свободно` : "мест нет"}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[14px] font-medium leading-snug">{session.title}</p>
                    <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted">{session.description}</p>
                  </div>

                  <div className="shrink-0">
                    {!hasLive ? (
                      <Link href="/pricing" className="btn btn-secondary btn-sm">
                        <Lock className="h-3.5 w-3.5" />
                        Тариф Live
                      </Link>
                    ) : session.registered ? (
                      <div className="flex flex-col items-stretch gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleRegistration(session)}
                          disabled={pendingId === session.id}
                          className="btn btn-secondary btn-sm"
                        >
                          {pendingId === session.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Вы записаны
                        </button>
                        <button type="button" className="text-[10.5px] text-muted underline underline-offset-2">
                          Ссылка появится за 30 минут
                        </button>
                      </div>
                    ) : seatsLeft === 0 ? (
                      <span className="badge">Мест нет</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleRegistration(session)}
                        disabled={pendingId === session.id}
                        className="btn btn-primary btn-sm"
                      >
                        {pendingId === session.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        Записаться
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-6 rounded-[16px] border border-line bg-[#f7f3ea] p-4">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Как это работает</p>
        <p className="mt-2 text-[12px] leading-relaxed text-[#4d5050]">
          Запись на занятие сохраняется на сервере. Ссылка на трансляцию появляется за 30 минут до начала в этом
          разделе и в уведомлениях. Если занятие отменяется, вы получите уведомление.
        </p>
      </div>
    </>
  );
}
