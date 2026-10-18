"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState<{ message: string; previewUrl: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email") }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setError(json?.error?.message ?? "Не удалось отправить запрос.");
        return;
      }
      setSent({
        message: json?.data?.message ?? "Проверьте почту.",
        previewUrl: json?.data?.previewUrl ?? null,
      });
    } catch {
      setError("Нет соединения. Попробуйте ещё раз.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div>
        <div className="flex items-start gap-3 rounded-xl border border-line bg-[#f7f3ea] p-4">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#6f7d68]" />
          <p className="text-[12.5px] leading-relaxed text-[#5c5f56]">{sent.message}</p>
        </div>

        {sent.previewUrl ? (
          <div className="mt-4 rounded-xl border border-[#dccdb4] bg-[#f7f1e4] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a7251]">Демо-режим</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[#6b5b42]">
              Письма не отправляются. Ссылка для сброса пароля доступна здесь.
            </p>
            <Link
              href={sent.previewUrl.replace(/^https?:\/\/[^/]+/, "")}
              className="mt-2 inline-flex text-[12px] font-medium text-[#5a4a32] underline underline-offset-2"
            >
              Задать новый пароль
            </Link>
          </div>
        ) : null}

        <Link href="/login" className="btn btn-secondary mt-5 w-full">
          Вернуться ко входу
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <label htmlFor="email" className="label">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        className="input"
        placeholder="you@example.com"
      />

      {error ? (
        <p role="alert" className="mt-3 rounded-lg border border-[#e3c8c0] bg-[#fbf1ee] px-3 py-2 text-[12px] text-[#8a3d2f]">
          {error}
        </p>
      ) : null}

      <button type="submit" className="btn btn-primary mt-5 w-full" disabled={pending}>
        {pending ? "Отправляем…" : "Отправить ссылку"}
      </button>
      <p className="mt-3 text-[11px] leading-relaxed text-muted">
        Если аккаунта с таким email нет, письмо не придёт. Мы не раскрываем наличие аккаунтов.
      </p>
    </form>
  );
}
