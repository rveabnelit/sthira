"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { Practice } from "@/lib/types";
import { useToast } from "@/components/ui/toast";

export function PracticeStatusToggle({ practice }: { practice: Practice }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const nextStatus = practice.status === "published" ? "draft" : "published";

  async function toggle() {
    setPending(true);
    try {
      const response = await fetch(`/api/v1/admin/practices/${practice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: practice.title,
          slug: practice.slug,
          description: practice.description,
          teacherNote: practice.teacherNote,
          thumbnailUrl: practice.thumbnailUrl,
          coverTone: practice.coverTone,
          videoProvider: practice.videoProvider === "external" ? "external" : "mock",
          videoUrl: practice.videoUrl,
          videoAssetId: practice.videoAssetId,
          durationMinutes: practice.durationMinutes,
          difficulty: practice.difficulty,
          goal: practice.goal,
          tags: practice.tags,
          requiredPlan: practice.requiredPlan,
          status: nextStatus,
        }),
      });
      if (!response.ok) {
        const json = await response.json().catch(() => null);
        toast.push(json?.error?.message ?? "Не удалось изменить статус.", "error");
        return;
      }
      toast.push(nextStatus === "published" ? "Практика опубликована." : "Практика снята с публикации.", "success");
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
      onClick={toggle}
      disabled={pending}
      className="text-[10.5px] font-medium text-forest underline underline-offset-2 hover:text-forest-deep"
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : nextStatus === "published" ? "Опубликовать" : "Снять"}
    </button>
  );
}
