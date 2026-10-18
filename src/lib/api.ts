import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/types";

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function ok<T>(data: T, status = 200, init?: ResponseInit) {
  return NextResponse.json({ data }, { status, ...init });
}

export function fail(code: string, message: string, status = 400, details?: unknown) {
  const body: ApiErrorBody = { error: { code, message, ...(details ? { details } : {}) } };
  return NextResponse.json(body, { status });
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "local";
}

export type Parsed<T> = { success: true; data: T } | { success: false; response: NextResponse };

export async function parseBody<S extends z.ZodTypeAny>(request: Request, schema: S): Promise<Parsed<z.infer<S>>> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return { success: false, response: fail("invalid_json", "Не удалось прочитать данные запроса.", 400) };
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      success: false,
      response: fail("validation_error", first?.message ?? "Проверьте заполнение полей.", 422, parsed.error.flatten()),
    };
  }
  return { success: true, data: parsed.data };
}

export async function requireApiUser(): Promise<{ user: SessionUser } | { response: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) {
    return { response: fail("unauthorized", "Требуется вход в аккаунт.", 401) };
  }
  return { user };
}

export async function requireApiAdmin(): Promise<{ user: SessionUser } | { response: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) return { response: fail("unauthorized", "Требуется вход в аккаунт.", 401) };
  if (user.role !== "admin") {
    return { response: fail("forbidden", "Недостаточно прав для этого действия.", 403) };
  }
  return { user };
}

export const emailSchema = z
  .string()
  .trim()
  .min(3, "Укажите email.")
  .max(254, "Email слишком длинный.")
  .email("Проверьте формат email.");

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
