"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function CancelSession({ sessionId, title }: { sessionId: string; title: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function cancel() {
    setPending(true);
    try {
      const response = await fetch(`/api/v1/admin/live-sessions/${sessionId}/cancel`, { method: "POST" });
      if (!response.ok) {
        toast.push(`Не удалось отменить «${title}».`, "error");
        return;
      }
      toast.push("Занятие отменено. Ученики увидят статус в расписании.", "success");
      router.refresh();
    } finally {
      setPending(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="text-[10.5px] text-[#8a3d2f] underline underline-offset-2">
        Отменить занятие
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10.5px] text-[#8a3d2f]">Отменить?</span>
      <button type="button" onClick={cancel} disabled={pending} className="text-[10.5px] font-medium text-[#8a3d2f] underline">
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Да"}
      </button>
      <button type="button" onClick={() => setConfirming(false)} className="text-[10.5px] text-muted underline">
        Нет
      </button>
    </div>
  );
}
