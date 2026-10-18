"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn } from "lucide-react";

export function LoginForm({
  nextPath,
  hintMode = "false",
}: {
  nextPath: string;
  hintMode?: "all" | "student" | "false";
}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setError(json?.error?.message ?? "Не удалось войти. Проверьте данные.");
        return;
      }
      const target = nextPath && nextPath !== "/app" ? nextPath : json?.data?.redirectTo ?? "/app";
      router.push(target);
      router.refresh();
    } catch {
      setError("Нет соединения. Проверьте сеть и попробуйте снова.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div>
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
          aria-invalid={Boolean(error)}
        />
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <label htmlFor="password" className="label">
            Пароль
          </label>
          <Link href="/forgot-password" className="mb-1.5 text-[11.5px] text-muted hover:text-forest">
            Забыли пароль?
          </Link>
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            className="input pr-11"
            placeholder="••••••••"
            aria-invalid={Boolean(error)}
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

      {error ? (
        <p role="alert" className="mt-3 rounded-lg border border-[#e3c8c0] bg-[#fbf1ee] px-3 py-2 text-[12px] text-[#8a3d2f]">
          {error}
        </p>
      ) : null}

      <button type="submit" className="btn btn-primary mt-5 w-full" disabled={pending}>
        {pending ? "Входим…" : "Войти"}
        {!pending ? <LogIn className="h-4 w-4" /> : null}
      </button>

      {hintMode !== "false" ? (
        <div className="mt-6 rounded-xl border border-line bg-[#f7f3ea] p-3.5">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Демо-доступ</p>
          <div className="mt-2 space-y-1 text-[11.5px] leading-relaxed text-[#5c5f56]">
            <p>
              Ученик: <span className="font-medium text-ink">student@sthira.school</span> / Student12345!
            </p>
            <p>
              Новый ученик: <span className="font-medium text-ink">new@sthira.school</span> / Student12345!
            </p>
            {hintMode === "all" ? (
              <p>
                Администратор: <span className="font-medium text-ink">admin@sthira.school</span> / Admin12345!
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </form>
  );
}
