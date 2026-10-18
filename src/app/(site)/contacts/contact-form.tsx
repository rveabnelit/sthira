"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

const TOPICS = ["Подписка и оплата", "Технический вопрос", "Практика и программы", "AI-наставник", "Сотрудничество", "Другое"];

export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setState("sending");
    setError(null);
    try {
      const response = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setState("error");
        setError(json?.error?.message ?? "Не удалось отправить сообщение. Попробуйте ещё раз.");
        return;
      }
      setState("sent");
      form.reset();
    } catch {
      setState("error");
      setError("Нет соединения. Проверьте сеть и попробуйте снова.");
    }
  }

  if (state === "sent") {
    return (
      <div className="surface p-8 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-sage-soft text-forest">
          <Check className="h-5 w-5" />
        </span>
        <h2 className="display-4 mt-5">Сообщение отправлено</h2>
        <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-muted">
          Мы ответим на указанный email в рабочие дни. Обычное время ответа — один-два рабочих дня.
        </p>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="mt-6 text-[12.5px] text-forest underline-offset-4 hover:underline"
        >
          Написать ещё одно сообщение
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="surface p-6 md:p-7" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label">
            Имя <span className="text-[#9b4a3a]">*</span>
          </label>
          <input id="name" name="name" required minLength={2} maxLength={120} className="input" autoComplete="name" />
        </div>
        <div>
          <label htmlFor="email" className="label">
            Email <span className="text-[#9b4a3a]">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={254}
            className="input"
            autoComplete="email"
            inputMode="email"
          />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="topic" className="label">
          Тема обращения
        </label>
        <select id="topic" name="topic" className="select" defaultValue={TOPICS[0]}>
          {TOPICS.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label htmlFor="message" className="label">
          Сообщение <span className="text-[#9b4a3a]">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          minLength={10}
          maxLength={4000}
          rows={6}
          className="textarea"
          placeholder="Опишите ситуацию — чем подробнее, тем точнее мы сможем ответить."
        />
      </div>

      <label className="mt-4 flex items-start gap-2.5 text-[11.5px] leading-relaxed text-muted">
        <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 accent-forest" />
        <span>
          Отправляя форму, я соглашаюсь с{" "}
          <a href="/privacy" className="link-underline text-forest">
            политикой конфиденциальности
          </a>{" "}
          и обработкой данных для ответа на обращение.
        </span>
      </label>

      {error ? <p className="field-error mt-3">{error}</p> : null}

      <button type="submit" className="btn btn-primary mt-5 w-full" disabled={state === "sending"}>
        {state === "sending" ? "Отправляем…" : "Отправить сообщение"}
        {state !== "sending" ? <ArrowRight className="h-4 w-4" /> : null}
      </button>
      <p className="mt-3 text-[11px] text-muted">
        Не отправляйте медицинские документы и чувствительные данные — они не нужны для ответа.
      </p>
    </form>
  );
}
