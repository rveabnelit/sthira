import { NextResponse } from "next/server";
import { z } from "zod";
import { one, run } from "@/lib/db";
import { emailSchema, fail, normalizeEmail, ok, parseBody, getClientIp } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { hashPassword, passwordIssues } from "@/lib/auth/password";
import { cleanupExpiredSessions, createSession, isSecureRequest, sessionCookieOptions } from "@/lib/auth/session";
import { createAuthToken } from "@/lib/auth/tokens";
import { DEMO_MODE, sendEmail } from "@/lib/email";
import { trackEvent } from "@/lib/analytics";

const schema = z.object({
  displayName: z.string().trim().min(2, "Укажите имя — минимум 2 символа.").max(60, "Имя слишком длинное."),
  email: emailSchema,
  password: z.string().min(8, "Пароль должен содержать минимум 8 символов.").max(200),
  consent: z.boolean().refine((value) => value, "Необходимо согласие с условиями обработки данных."),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`register:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    return fail("rate_limited", `Слишком много попыток. Повторите через ${limit.retryAfterSeconds} с.`, 429);
  }

  const parsed = await parseBody(request, schema);
  if (!parsed.success) return parsed.response;

  const { displayName, password } = parsed.data;
  const email = normalizeEmail(parsed.data.email);

  const issue = passwordIssues(password);
  if (issue) return fail("weak_password", issue, 422);

  const exists = one<{ id: string }>("SELECT id FROM users WHERE email = ?", email);
  if (exists) {
    return fail("email_taken", "Аккаунт с таким email уже существует. Войдите или восстановите пароль.", 409);
  }

  const now = new Date().toISOString();
  const userId = crypto.randomUUID();
  try {
    run(
      `INSERT INTO users (id, email, password_hash, display_name, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'student', ?, ?)`,
      userId,
      email,
      hashPassword(password),
      displayName,
      now,
      now,
    );
  } catch {
    return fail("email_taken", "Аккаунт с таким email уже существует.", 409);
  }

  run(
    `INSERT INTO user_preferences (user_id, timezone, reminders_enabled, updated_at)
     VALUES (?, 'Europe/Moscow', 0, ?)`,
    userId,
    now,
  );

  trackEvent("signup_started", { userId, props: { email } });
  trackEvent("signup_completed", { userId });

  cleanupExpiredSessions();
  const session = createSession(userId, {
    userAgent: request.headers.get("user-agent"),
    ip,
  });

  const verifyToken = createAuthToken(userId, "email_verify", 24 * 60);
  const origin = new URL(request.url).origin;
  const verifyUrl = `${origin}/verify-email?token=${verifyToken}`;
  await sendEmail({
    to: email,
    subject: "Подтвердите email — STHIRA",
    text: `Здравствуйте! Подтвердите адрес электронной почты, чтобы завершить регистрацию в STHIRA. Ссылка действует 24 часа.`,
    link: verifyUrl,
  });

  const response = NextResponse.json(
    {
      data: {
        user: { id: userId, email, displayName, role: "student", emailVerified: false },
        verification: {
          required: true,
          // В демо-режиме письмо не отправляется, ссылка показывается в интерфейсе.
          previewUrl: DEMO_MODE ? verifyUrl : null,
        },
      },
    },
    { status: 201 },
  );
  response.cookies.set("sthira_session", session.token, sessionCookieOptions(session.expiresAt, { secure: isSecureRequest(request) }));
  return response;
}
