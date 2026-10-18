import { z } from "zod";
import { one, run } from "@/lib/db";
import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { getPreferences } from "@/lib/data/preferences";

const schema = z.object({
  displayName: z.string().trim().min(2, "Имя должно быть не короче 2 символов.").max(60, "Слишком длинное имя."),
});

export async function GET() {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  return ok({
    user: {
      id: auth.user.id,
      email: auth.user.email,
      displayName: auth.user.displayName,
      role: auth.user.role,
      emailVerifiedAt: auth.user.emailVerifiedAt,
      createdAt: auth.user.createdAt,
      preferences: getPreferences(auth.user.id),
    },
  });
}

export async function PATCH(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const parsed = await parseBody(request, schema);
  if (!parsed.success) return parsed.response;
  run(
    "UPDATE users SET display_name = ?, updated_at = ? WHERE id = ?",
    parsed.data.displayName,
    new Date().toISOString(),
    auth.user.id,
  );
  return ok({ displayName: parsed.data.displayName });
}

export async function DELETE(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => ({}));
  if (!body || body.confirm !== "УДАЛИТЬ") {
    return fail("confirmation_required", "Для удаления аккаунта введите слово УДАЛИТЬ.", 422);
  }

  const now = new Date().toISOString();
  run(
    "UPDATE users SET deleted_at = ?, email = ?, display_name = 'Удалённый аккаунт', updated_at = ? WHERE id = ?",
    now,
    `deleted+${auth.user.id}@sthira.invalid`,
    now,
    auth.user.id,
  );
  run("DELETE FROM sessions WHERE user_id = ?", auth.user.id);
  run(
    "UPDATE subscriptions SET status = 'expired', cancel_at_period_end = 1, updated_at = ? WHERE user_id = ? AND status IN ('active','canceled','past_due','pending')",
    now,
    auth.user.id,
  );
  run(
    "DELETE FROM guide_conversations WHERE user_id = ?",
    auth.user.id,
  );
  // Платёжные документы сохраняются в объёме, требуемом для бухгалтерии.

  const user = one<{ id: string }>("SELECT id FROM users WHERE id = ?", auth.user.id);
  if (!user) return fail("not_found", "Аккаунт не найден.", 404);

  const response = ok({ deleted: true, message: "Аккаунт удалён. Платёжные документы сохранены согласно закону." });
  response.cookies.set("sthira_session", "", { path: "/", maxAge: 0 });
  return response;
}
