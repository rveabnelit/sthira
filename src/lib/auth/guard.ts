import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/types";

/** Серверная проверка авторизации для страниц личного кабинета. */
export async function requireUser(nextPath?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    const target = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";
    redirect(target);
  }
  return user;
}

/** Серверная проверка административных прав (не только скрытие пунктов меню). */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser("/admin");
  if (user.role !== "admin") {
    redirect("/app?notice=admin_only");
  }
  return user;
}
