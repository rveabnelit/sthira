"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Eye, EyeOff } from "lucide-react";

type Registered = {
  email: string;
  previewUrl: string | null;
};

export function SignupForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [registered, setRegistered] = useState<Registered | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password") ?? "");
    const confirm = String(data.get("confirm") ?? "");
    if (password !== confirm) {
      setError("Пароли не совпадают.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: data.get("displayName"),
          email: data.get("email"),
          password,
          consent: data.get("consent") === "on",
        }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setError(json?.error?.message ?? "Не удалось создать аккаунт.");
        return;
      }
      setRegistered({
        email: String(data.get("email") ?? ""),
        previewUrl: json?.data?.verification?.previewUrl ?? null,
      });
    } catch {
      setError("Нет соединения. Проверьте сеть и попробуйте снова.");
    } finally {
      setPending(false);
    }
  }

  if (registered) {
    return (
      <div>
        <div className="flex items-start gap-3 rounded-xl border border-[#cdd7c6] bg-[#f2f6ee] p-4">
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#4f6b52] text-ivory">
            <Check className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-[13px] font-medium text-[#3d553f]">Аккаунт создан</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#4f5f4c]">
              Мы отправили письмо на {registered.email}. Подтвердите адрес, чтобы завершить настройку.
            </p>
          </div>
        </div>

        {registered.previewUrl ? (
          <div className="mt-4 rounded-xl border border-[#dccdb4] bg-[#f7f1e4] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a7251]">Демо-режим</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[#6b5b42]">
              Письма не отправляются. Ссылка подтверждения доступна здесь.
            </p>
            <Link
              href={registered.previewUrl.replace(/^https?:\/\/[^/]+/, "")}
              className="mt-2 inline-flex break-all text-[12px] font-medium text-[#5a4a32] underline underline-offset-2"
            >
              Подтвердить email
            </Link>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => {
            router.push(nextPath);
            router.refresh();
          }}
          className="btn btn-primary mt-5 w-full"
        >
          Продолжить
          <ArrowRight className="h-4 w-4" />
        </button>
        <p className="mt-3 text-center text-[11px] leading-relaxed text-muted">
          Подтвердить email можно позже в настройках профиля.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div>
        <label htmlFor="displayName" className="label">
          Как вас зовут
        </label>
        <input
          id="displayName"
          name="displayName"
          required
          minLength={2}
          maxLength={60}
          autoComplete="given-name"
          className="input"
          placeholder="Имя"
        />
        <p className="hint">Имя будет видно только вам в личном кабинете.</p>
      </div>

      <div className="mt-4">
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
      </div>

      <div className="mt-4">
        <label htmlFor="password" className="label">
          Пароль
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            className="input pr-11"
            placeholder="Минимум 8 символов, буквы и цифры"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted transition-colors hover:text-forest"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="confirm" className="label">
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
      </div>

      <label className="mt-4 flex items-start gap-2.5 text-[11.5px] leading-relaxed text-muted">
        <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 accent-forest" />
        <span>
          Я принимаю{" "}
          <Link href="/terms" className="link-underline text-forest">
            пользовательское соглашение
          </Link>{" "}
          и{" "}
          <Link href="/privacy" className="link-underline text-forest">
            политику конфиденциальности
          </Link>
          .
        </span>
      </label>

      {error ? (
        <p role="alert" className="mt-3 rounded-lg border border-[#e3c8c0] bg-[#fbf1ee] px-3 py-2 text-[12px] text-[#8a3d2f]">
          {error}
        </p>
      ) : null}

      <button type="submit" className="btn btn-primary mt-5 w-full" disabled={pending}>
        {pending ? "Создаём аккаунт…" : "Создать аккаунт"}
        {!pending ? <ArrowRight className="h-4 w-4" /> : null}
      </button>

      <p className="mt-3 text-center text-[10.5px] leading-relaxed text-muted">
        Регистрация не даёт медицинских рекомендаций. Практика не заменяет консультацию специалиста.
      </p>
    </form>
  );
}
