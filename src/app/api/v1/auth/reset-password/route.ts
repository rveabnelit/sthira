import { z } from "zod";
import { run } from "@/lib/db";
import { fail, ok, parseBody } from "@/lib/api";
import { hashPassword, passwordIssues } from "@/lib/auth/password";
import { consumeAuthToken } from "@/lib/auth/tokens";
import { destroyUserSessions } from "@/lib/auth/session";

const schema = z.object({
  token: z.string().min(10, "Ссылка восстановления некорректна."),
  password: z.string().min(8, "Пароль должен содержать минимум 8 символов.").max(200),
});

export async function POST(request: Request) {
  const parsed = await parseBody(request, schema);
  if (!parsed.success) return parsed.response;

  const issue = passwordIssues(parsed.data.password);
  if (issue) return fail("weak_password", issue, 422);

  const consumed = consumeAuthToken(parsed.data.token, "password_reset");
  if (!consumed) {
    return fail("invalid_token", "Ссылка недействительна или уже использована. Запросите новую.", 400);
  }

  run(
    "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
    hashPassword(parsed.data.password),
    new Date().toISOString(),
    consumed.userId,
  );
  // Все активные сессии сбрасываются после смены пароля.
  destroyUserSessions(consumed.userId);

  return ok({ message: "Пароль обновлён. Войдите с новым паролем." });
}
