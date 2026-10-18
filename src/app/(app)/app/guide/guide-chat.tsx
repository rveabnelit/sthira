"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, FileText, Loader2, Sparkles } from "lucide-react";
import type { GuideMessage } from "@/lib/types";
import { cn } from "@/lib/cn";

const QUICK = [
  "С чего начать новичку?",
  "Подбери практику на 15 минут",
  "Как вернуться после перерыва?",
  "Что мне делать следующим в программе?",
];

type PracticeCard = {
  id: string;
  title: string;
  durationMinutes: number;
  difficulty: string;
  tone: string;
};

export function GuideChat({
  conversationId: initialConversationId,
  initialMessages,
  initialLimit,
  dailyLimit,
  prefill,
}: {
  conversationId: string | null;
  initialMessages: GuideMessage[];
  initialLimit: number;
  dailyLimit: number;
  prefill: string;
}) {
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [messages, setMessages] = useState<GuideMessage[]>(initialMessages);
  const [input, setInput] = useState(prefill);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(initialLimit);
  const [practices, setPractices] = useState<PracticeCard[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || pending) return;
    if (left <= 0) {
      setError(`Дневной лимит ${dailyLimit} сообщений исчерпан. Лимит обновится завтра.`);
      return;
    }
    setPending(true);
    setError(null);
    setInput("");
    const optimistic: GuideMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: message,
      citations: [],
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const response = await fetch("/api/v1/guide/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, conversationId }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setMessages((prev) => prev.filter((item) => item.id !== optimistic.id));
        setError(json?.error?.message ?? "Наставник временно недоступен. Остальные разделы работают.");
        return;
      }
      setConversationId(json.data.conversationId);
      setMessages((prev) => [...prev.filter((item) => item.id !== optimistic.id), ...json.data.messages]);
      setPractices(json.data.practices ?? []);
      setLeft(json.data.messagesLeft ?? Math.max(0, left - 1));
      if (json.data.conversationId && !initialConversationId) {
        window.history.replaceState(null, "", `/app/guide?conversation=${json.data.conversationId}`);
      }
    } catch {
      setMessages((prev) => prev.filter((item) => item.id !== optimistic.id));
      setError("Нет соединения. Сообщение не отправлено.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="surface flex min-h-[560px] flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-forest text-ivory">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[12.5px] font-medium leading-none">STHIRA Guide</p>
            <p className="mt-1 text-[10.5px] leading-none text-muted">
              по материалам школы · демо-режим без внешней модели
            </p>
          </div>
        </div>
        <span className="text-[10.5px] text-muted">{left} / {dailyLimit}</span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        {messages.length === 0 ? (
          <div className="py-8 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-sage-soft text-forest">
              <Sparkles className="h-5 w-5" />
            </span>
            <p className="mt-4 font-serif text-[1.3rem]">С чего начнём?</p>
            <p className="mx-auto mt-1.5 max-w-sm text-[12px] leading-relaxed text-muted">
              Спросите про практику, программу или возвращение к регулярности. Guide ответит по материалам школы и
              предложит конкретные занятия.
            </p>
          </div>
        ) : null}

        {messages.map((message) => (
          <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[88%] rounded-[14px] px-4 py-3 text-[13px] leading-relaxed",
                message.role === "user"
                  ? "rounded-br-[4px] bg-forest text-ivory"
                  : "rounded-bl-[4px] border border-line bg-[#f7f4ec] text-[#3f423b]",
              )}
            >
              <p className="whitespace-pre-line">{message.content}</p>
              {message.citations.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {message.citations.map((citation) => (
                    <Link
                      key={`${citation.href}-${citation.title}`}
                      href={citation.href}
                      className="inline-flex items-center gap-1.5 rounded-md border border-line bg-paper px-2 py-1 text-[10.5px] text-[#5c5f56] transition-colors hover:border-sage hover:text-forest"
                    >
                      <FileText className="h-3 w-3" />
                      {citation.title}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}

        {pending ? (
          <div className="flex items-center gap-2 text-[11.5px] text-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Guide подбирает ответ по материалам…
          </div>
        ) : null}

        {practices.length > 0 && !pending ? (
          <div className="rounded-xl border border-line bg-paper p-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Подходящие практики</p>
            <div className="mt-2 space-y-1.5">
              {practices.map((practice) => (
                <Link
                  key={practice.id}
                  href={`/app/practice/${practice.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-[11.5px] transition-colors hover:border-sage"
                >
                  <span className="truncate text-[#3f423b]">{practice.title}</span>
                  <span className="shrink-0 text-[10.5px] text-muted">{practice.durationMinutes} мин</span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-lg border border-[#e3c8c0] bg-[#fbf1ee] px-3 py-2 text-[11.5px] leading-relaxed text-[#8a3d2f]">
            {error}
          </p>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-line bg-paper p-3">
        <div className="scrollbar-hide mb-2 flex gap-1.5 overflow-x-auto">
          {QUICK.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => send(question)}
              className="shrink-0 rounded-full border border-line px-3 py-1.5 text-[10.5px] text-[#565950] transition-colors hover:border-sage hover:text-forest"
            >
              {question}
            </button>
          ))}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send(input);
          }}
          className="flex items-end gap-2"
        >
          <label htmlFor="guide-input" className="sr-only">
            Вопрос наставнику
          </label>
          <textarea
            id="guide-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(input);
              }
            }}
            rows={1}
            maxLength={1000}
            placeholder="Спросите про практику или программу…"
            className="textarea min-h-[44px] max-h-32 flex-1 resize-none border-line bg-paper py-2.5 text-[13px]"
            disabled={pending}
          />
          <button
            type="submit"
            disabled={pending || !input.trim()}
            aria-label="Отправить"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-forest text-ivory transition-colors hover:bg-forest-deep disabled:opacity-40"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          </button>
        </form>
        <p className="mt-2 text-[9.5px] leading-relaxed text-muted">
          Guide не ставит диагнозы и не заменяет консультацию специалиста. Ответы опираются на материалы школы.
        </p>
      </div>
    </div>
  );
}
