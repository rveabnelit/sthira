import { NextResponse } from "next/server";
import { z } from "zod";
import { run } from "@/lib/db";
import { fail, getClientIp, ok, parseBody } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/auth/session";

const schema = z.object({
  name: z.string().trim().min(2, "Укажите имя.").max(120),
  email: z.string().trim().email("Проверьте формат email."),
  topic: z.string().trim().min(2).max(80),
  message: z.string().trim().min(10, "Опишите ситуацию — минимум 10 символов.").max(4000),
  consent: z.union([z.literal("on"), z.boolean(), z.string()]).optional(),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    return fail("rate_limited", `Слишком много обращений. Повторите через ${limit.retryAfterSeconds} с.`, 429);
  }

  const parsed = await parseBody(request, schema);
  if (!parsed.success) return parsed.response;
  const user = await getCurrentUser();

  run(
    `INSERT INTO contact_messages (id, name, email, topic, message, status, created_at, user_id)
     VALUES (?, ?, ?, ?, ?, 'new', ?, ?)`,
    crypto.randomUUID(),
    parsed.data.name,
    parsed.data.email.toLowerCase(),
    parsed.data.topic,
    parsed.data.message,
    new Date().toISOString(),
    user?.id ?? null,
  );

  return ok({ message: "Сообщение отправлено. Мы ответим на указанный email." }, 201);
}
