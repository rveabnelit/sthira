import { NextResponse } from "next/server";
import { z } from "zod";
import { one } from "@/lib/db";
import { emailSchema, fail, getClientIp, normalizeEmail, ok, parseBody } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { verifyPassword } from "@/lib/auth/password";
import { cleanupExpiredSessions, createSession, isSecureRequest, sessionCookieOptions } from "@/lib/auth/session";

const schema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Введите пароль.").max(200),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const ipLimit = rateLimit(`login-ip:${ip}`, 25, 15 * 60 * 1000);
  if (!ipLimit.allowed) {
    return fail("rate_limited", `Слишком много попыток входа. Повторите через ${ipLimit.retryAfterSeconds} с.`, 429);
  }

  const parsed = await parseBody(request, schema);
  if (!parsed.success) return parsed.response;

  const email = normalizeEmail(parsed.data.email);
  const limit = rateLimit(`login:${ip}:${email}`, 6, 15 * 60 * 1000);
  if (!limit.allowed) {
    return fail("rate_limited", `Слишком много попыток. Повторите через ${limit.retryAfterSeconds} с.`, 429);
  }

  const user = one<{
    id: string;
    email: string;
    password_hash: string;
    display_name: string;
    role: "student" | "admin";
    email_verified_at: string | null;
    deleted_at: string | null;
  }>("SELECT id, email, password_hash, display_name, role, email_verified_at, deleted_at FROM users WHERE email = ?", email);

  // Одинаковый ответ для несуществующего аккаунта и неверного пароля.
  if (!user || user.deleted_at || !verifyPassword(parsed.data.password, user.password_hash)) {
    return fail("invalid_credentials", "Неверный email или пароль.", 401);
  }

  cleanupExpiredSessions();
  const session = createSession(user.id, { userAgent: request.headers.get("user-agent"), ip });

  const response = NextResponse.json({
    data: {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        emailVerified: Boolean(user.email_verified_at),
      },
      redirectTo: user.role === "admin" ? "/admin" : "/app",
    },
  });
  response.cookies.set("sthira_session", session.token, sessionCookieOptions(session.expiresAt, { secure: isSecureRequest(request) }));
  return response;
}
