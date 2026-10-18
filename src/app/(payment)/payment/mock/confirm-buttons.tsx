"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function MockConfirmButtons({ orderId, paymentId }: { orderId: string; paymentId: string }) {
  const [pending, setPending] = useState<"succeeded" | "failed" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(outcome: "succeeded" | "failed") {
    setPending(outcome);
    setError(null);
    try {
      const response = await fetch("/api/v1/payments/mock/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, paymentId, outcome }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setError(json?.error?.message ?? "Тестовый платёж не обработан.");
        return;
      }
      router.push(json.data.redirectTo);
    } catch {
      setError("Нет соединения. Попробуйте ещё раз.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        className="btn btn-primary w-full"
        onClick={() => submit("succeeded")}
        disabled={pending !== null}
      >
        {pending === "succeeded" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Оплатить {pending === "succeeded" ? "" : "(тест)"}
      </button>
      <button
        type="button"
        className="btn btn-secondary mt-2 w-full"
        onClick={() => submit("failed")}
        disabled={pending !== null}
      >
        {pending === "failed" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Смоделировать неуспешный платёж
      </button>
      {error ? <p className="field-error text-center">{error}</p> : null}
    </div>
  );
}
