"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2, X } from "lucide-react";

type State = "idle" | "loading" | "success" | "error";

export function VerifyEmail({ token }: { token: string | null }) {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("В ссылке нет токена подтверждения. Запросите новое письмо в настройках профиля.");
      return;
    }
    let cancelled = false;
    setState("loading");
    fetch("/api/v1/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        const json = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok) {
          setState("error");
          setMessage(json?.error?.message ?? "Не удалось подтвердить email.");
          return;
        }
        setState("success");
        setMessage(json?.data?.message ?? "Email подтверждён.");
      })
      .catch(() => {
        if (cancelled) return;
        setState("error");
        setMessage("Нет соединения. Проверьте сеть и обновите страницу.");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state === "loading" || state === "idle") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-line bg-paper p-4">
        <Loader2 className="h-4 w-4 animate-spin text-[#6f7d68]" />
        <p className="text-[13px] text-muted">Проверяем ссылку…</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div>
        <div className="flex items-start gap-3 rounded-xl border border-[#e3c8c0] bg-[#fbf1ee] p-4">
          <X className="mt-0.5 h-4 w-4 shrink-0 text-[#8a3d2f]" />
          <p className="text-[12.5px] leading-relaxed text-[#8a3d2f]">{message}</p>
        </div>
        <Link href="/app/settings" className="btn btn-primary mt-5 w-full">
          В настройки профиля
        </Link>
        <p className="mt-3 text-center text-[11px] leading-relaxed text-muted">
          Ссылка действует 24 часа и может быть использована только один раз.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#e4ebe1] text-[#3f5a43]">
        <Check className="h-5 w-5" />
      </span>
      <p className="mt-4 text-[14px] font-medium">{message}</p>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
        Теперь можно заниматься, сохранять прогресс и пользоваться наставником.
      </p>
      <Link href="/app" className="btn btn-primary mt-5 w-full">
        Перейти в кабинет
      </Link>
      <Link href="/practice" className="mt-3 block text-[12px] text-muted hover:text-forest">
        Или посмотреть практики
      </Link>
    </div>
  );
}
