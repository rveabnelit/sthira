"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCw } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function WebhookReplay({ externalId }: { externalId: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function replay() {
    setPending(true);
    try {
      const response = await fetch("/api/v1/admin/webhooks/replay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ externalId }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        toast.push(json?.error?.message ?? "Не удалось повторить событие.", "error");
        return;
      }
      toast.push(
        json?.data?.result?.status === "duplicate"
          ? "Событие уже обработано — повторная активация не произошла."
          : "Событие обработано.",
        "success",
      );
      router.refresh();
    } catch {
      toast.push("Нет соединения.", "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={replay}
      disabled={pending}
      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-line px-2 py-1 text-[10px] text-[#565950] hover:border-forest hover:text-forest"
    >
      {pending ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <RotateCw className="h-2.5 w-2.5" />}
      Повторить
    </button>
  );
}
