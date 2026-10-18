"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

export function MarkAllRead() {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function markAll() {
    setPending(true);
    try {
      await fetch("/api/v1/users/me/notifications", { method: "POST" });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button type="button" onClick={markAll} disabled={pending} className="btn btn-secondary btn-sm">
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
      Отметить все прочитанными
    </button>
  );
}
