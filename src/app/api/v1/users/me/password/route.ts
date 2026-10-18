import { z } from "zod";
import { one, run } from "@/lib/db";
import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { hashPassword, passwordIssues, verifyPassword } from "@/lib/auth/password";
import { destroyUserSessions, getCurrentSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  currentPassword: z.string().min(1, "Введите текущий пароль."),
  newPassword: z.string().min(8, "Новый пароль должен содержать минимум 8 символов.").max(200),
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const limit = rateLimit(`password:${auth.user.id}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) return fail("rate_limited", "Слишком много попыток. Повторите позже.", 429);

  const parsed = await parseBody(request, schema);
  if (!parsed.success) return parsed.response;

  const issue = passwordIssues(parsed.data.newPassword);
  if (issue) return fail("weak_password", issue, 422);

  const row = one<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = ?", auth.user.id);
  if (!row || !verifyPassword(parsed.data.currentPassword, row.password_hash)) {
    return fail("invalid_password", "Текущий пароль указан неверно.", 401);
  }

  run(
    "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
    hashPassword(parsed.data.newPassword),
    new Date().toISOString(),
    auth.user.id,
  );
  // Остальные сессии сбрасываются; текущая остаётся активной.
  const session = await getCurrentSession();
  destroyUserSessions(auth.user.id, session?.sessionId);

  return ok({ message: "Пароль обновлён. Активные сессии на других устройствах завершены." });
}

export const dynamic = "force-dynamic";
