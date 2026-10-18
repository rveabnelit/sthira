"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function StartPaymentButton({ planCode }: { planCode: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  async function onClick() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planCode }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setError(json?.error?.message ?? "Не удалось создать платёжную сессию.");
        return;
      }
      toast.push("Заказ создан. Переходим к оплате.", "success");
      router.push(json.data.confirmationUrl);
    } catch {
      setError("Нет соединения. Проверьте сеть и попробуйте снова.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={onClick} disabled={pending} className="btn btn-primary mt-5 w-full">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        {pending ? "Создаём заказ…" : "Перейти к оплате"}
      </button>
      {error ? <p className="field-error text-center">{error}</p> : null}
    </div>
  );
}
