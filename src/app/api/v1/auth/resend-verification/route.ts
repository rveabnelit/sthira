import { one } from "@/lib/db";
import { fail, ok, requireApiUser } from "@/lib/api";
import { createAuthToken } from "@/lib/auth/tokens";
import { rateLimit } from "@/lib/rate-limit";
import { DEMO_MODE, sendEmail } from "@/lib/email";
import { emailTemplate } from "@/lib/email-templates";

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const limit = rateLimit(`resend:${auth.user.id}`, 3, 10 * 60 * 1000);
  if (!limit.allowed) {
    return fail("rate_limited", `Письмо уже отправлено. Повторите через ${limit.retryAfterSeconds} с.`, 429);
  }

  const user = one<{ email: string; email_verified_at: string | null }>(
    "SELECT email, email_verified_at FROM users WHERE id = ?",
    auth.user.id,
  );
  if (!user) return fail("not_found", "Аккаунт не найден.", 404);
  if (user.email_verified_at) return ok({ alreadyVerified: true });

  const token = createAuthToken(auth.user.id, "email_verify", 24 * 60);
  const verifyUrl = `${new URL(request.url).origin}/verify-email?token=${token}`;
  const template = emailTemplate("verify", verifyUrl);
  await sendEmail({ to: user.email, subject: template.subject, text: template.text, link: verifyUrl });

  return ok({ sent: true, previewUrl: DEMO_MODE ? verifyUrl : null });
}

export async function GET() {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const user = one<{ email_verified_at: string | null }>(
    "SELECT email_verified_at FROM users WHERE id = ?",
    auth.user.id,
  );
  return ok({ verified: Boolean(user?.email_verified_at) });
}
