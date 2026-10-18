"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    if (password !== String(data.get("confirm") ?? "")) {
      setError("Пароли не совпадают.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setError(json?.error?.message ?? "Не удалось изменить пароль.");
        return;
      }
      setDone(true);
    } catch {
      setError("Нет соединения. Попробуйте ещё раз.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-sage-soft text-forest">
          <Check className="h-5 w-5" />
        </span>
        <p className="mt-4 text-[14px] font-medium">Пароль обновлён</p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
          Все активные сессии завершены. Войдите с новым паролем.
        </p>
        <button type="button" onClick={() => router.push("/login")} className="btn btn-primary mt-5 w-full">
          Войти
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <label htmlFor="password" className="label">
        Новый пароль
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        className="input"
        placeholder="Минимум 8 символов, буквы и цифры"
      />
      <label htmlFor="confirm" className="label mt-4">
        Повторите пароль
      </label>
      <input
        id="confirm"
        name="confirm"
        type="password"
        required
        autoComplete="new-password"
        className="input"
        placeholder="Ещё раз"
      />

      {error ? (
        <p role="alert" className="mt-3 rounded-lg border border-[#e3c8c0] bg-[#fbf1ee] px-3 py-2 text-[12px] text-[#8a3d2f]">
          {error}
        </p>
      ) : null}

      <button type="submit" className="btn btn-primary mt-5 w-full" disabled={pending}>
        {pending ? "Сохраняем…" : "Сохранить пароль"}
      </button>
      <p className="mt-3 text-center text-[11px] text-muted">
        <Link href="/forgot-password" className="hover:text-forest">
          Запросить новую ссылку
        </Link>
      </p>
    </form>
  );
}
