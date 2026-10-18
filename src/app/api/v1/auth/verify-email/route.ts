import { z } from "zod";
import { one, run } from "@/lib/db";
import { fail, ok, parseBody } from "@/lib/api";
import { consumeAuthToken } from "@/lib/auth/tokens";

const schema = z.object({ token: z.string().min(10, "Ссылка подтверждения некорректна.") });

export async function POST(request: Request) {
  const parsed = await parseBody(request, schema);
  if (!parsed.success) return parsed.response;

  const consumed = consumeAuthToken(parsed.data.token, "email_verify");
  if (!consumed) {
    return fail("invalid_token", "Ссылка подтверждения недействительна или уже использована.", 400);
  }

  run(
    "UPDATE users SET email_verified_at = COALESCE(email_verified_at, ?), updated_at = ? WHERE id = ?",
    new Date().toISOString(),
    new Date().toISOString(),
    consumed.userId,
  );

  const user = one<{ email: string; display_name: string }>(
    "SELECT email, display_name FROM users WHERE id = ?",
    consumed.userId,
  );

  return ok({ message: "Email подтверждён.", email: user?.email ?? null });
}
