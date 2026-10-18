"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/toast";

export function FavoriteButton({
  practiceId,
  initial,
  className,
  withLabel = false,
  variant = "floating",
}: {
  practiceId: string;
  initial: boolean;
  className?: string;
  withLabel?: boolean;
  variant?: "floating" | "inline";
}) {
  const [favorite, setFavorite] = useState(initial);
  const [pending, setPending] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const busy = pending || isPending;

  async function toggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (busy) return;
    setPending(true);
    try {
      const response = await fetch(`/api/v1/users/me/favorites/${practiceId}`, {
        method: favorite ? "DELETE" : "POST",
      });
      if (response.status === 401) {
        toast.push("Войдите в аккаунт, чтобы сохранять практики.", "error");
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (!response.ok) {
        toast.push("Не удалось обновить избранное. Попробуйте ещё раз.", "error");
        return;
      }
      setFavorite(!favorite);
      toast.push(favorite ? "Практика удалена из избранного." : "Практика добавлена в избранное.", "success");
      startTransition(() => router.refresh());
    } catch {
      toast.push("Нет соединения. Изменение не сохранено.", "error");
    } finally {
      setPending(false);
    }
  }

  if (withLabel) {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={favorite}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border border-line px-3.5 py-2 text-[13px] font-medium transition-colors hover:bg-paper",
          favorite ? "text-forest" : "text-[#5c5f56]",
          className,
        )}
      >
        <Heart className={cn("h-4 w-4", favorite && "fill-forest text-forest")} />
        {favorite ? "В избранном" : "В избранное"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={favorite ? "Удалить из избранного" : "Добавить в избранное"}
      aria-pressed={favorite}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/70 text-forest backdrop-blur transition hover:bg-white",
        className,
      )}
    >
      <Heart className={cn("h-[18px] w-[18px]", favorite ? "fill-forest text-forest" : "text-ink/70")} />
    </button>
  );
}
