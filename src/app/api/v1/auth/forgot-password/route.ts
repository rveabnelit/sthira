import { z } from "zod";
import { one } from "@/lib/db";
import { emailSchema, fail, getClientIp, normalizeEmail, ok, parseBody } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { createAuthToken } from "@/lib/auth/tokens";
import { DEMO_MODE, sendEmail } from "@/lib/email";
import { emailTemplate } from "@/lib/email-templates";

const schema = z.object({ email: emailSchema });

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const parsed = await parseBody(request, schema);
  if (!parsed.success) return parsed.response;
  const email = normalizeEmail(parsed.data.email);
  const limit = rateLimit(`forgot:${ip}:${email}`, 4, 15 * 60 * 1000);
  if (!limit.allowed) {
    return fail("rate_limited", `Слишком много запросов. Повторите через ${limit.retryAfterSeconds} с.`, 429);
  }

  const user = one<{ id: string; deleted_at: string | null }>(
    "SELECT id, deleted_at FROM users WHERE email = ?",
    email,
  );

  let previewUrl: string | null = null;
  if (user && !user.deleted_at) {
    const token = createAuthToken(user.id, "password_reset", 60);
    const resetUrl = `${new URL(request.url).origin}/reset-password?token=${token}`;
    const template = emailTemplate("password_reset", resetUrl);
    await sendEmail({ to: email, subject: template.subject, text: template.text, link: resetUrl });
    previewUrl = DEMO_MODE ? resetUrl : null;
  }

  // Ответ не раскрывает, существует ли аккаунт с таким email.
  return ok({
    message: "Если аккаунт с таким email существует, мы отправили ссылку для восстановления доступа.",
    previewUrl,
  });
}
