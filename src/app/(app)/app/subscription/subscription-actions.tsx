"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function SubscriptionActions({ canceled, periodEnd }: { canceled: boolean; periodEnd: string | null }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  async function call(action: "cancel" | "resume") {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/subscriptions/${action}`, { method: "POST" });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setError(json?.error?.message ?? "Не удалось выполнить действие.");
        return;
      }
      toast.push(
        action === "cancel"
          ? "Автопродление отменено. Доступ сохранится до конца периода."
          : "Автопродление возобновлено.",
        "success",
      );
      setConfirming(false);
      router.refresh();
    } catch {
      setError("Нет соединения. Попробуйте ещё раз.");
    } finally {
      setPending(false);
    }
  }

  if (canceled) {
    return (
      <button type="button" onClick={() => call("resume")} disabled={pending} className="btn btn-primary btn-sm shrink-0">
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        Возобновить продление
      </button>
    );
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="btn btn-secondary btn-sm shrink-0 text-[#8a3d2f]"
      >
        Отменить автопродление
      </button>
    );
  }

  return (
    <div className="w-full rounded-xl border border-[#e3c8c0] bg-[#fbf1ee] p-4 sm:max-w-sm">
      <p className="flex items-start gap-2 text-[12px] font-medium text-[#8a3d2f]">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Отменить автопродление?
      </p>
      <p className="mt-1.5 text-[11.5px] leading-relaxed text-[#7a5045]">
        Доступ сохранится до {periodEnd ? new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(new Date(periodEnd)) : "конца периода"}.
        После этой даты доступ к платным материалам закроется, прогресс сохранится.
      </p>
      {error ? <p className="field-error">{error}</p> : null}
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => call("cancel")} disabled={pending} className="btn btn-danger btn-sm">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Да, отменить
        </button>
        <button type="button" onClick={() => setConfirming(false)} disabled={pending} className="btn btn-secondary btn-sm">
          Оставить
        </button>
      </div>
    </div>
  );
}
