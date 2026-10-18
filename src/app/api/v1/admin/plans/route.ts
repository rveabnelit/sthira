import { run } from "@/lib/db";
import { fail, ok, parseBody, requireApiAdmin } from "@/lib/api";
import { planUpdateSchema } from "@/lib/admin-schemas";
import { logAudit } from "@/lib/audit";

export async function PATCH(request: Request) {
  const auth = await requireApiAdmin();
  if ("response" in auth) return auth.response;
  const parsed = await parseBody(request, planUpdateSchema);
  if (!parsed.success) return parsed.response;
  const data = parsed.data;

  const existing = run(
    `UPDATE plans SET price = ?, is_active = coalesce(?, is_active), is_recommended = coalesce(?, is_recommended),
            description = coalesce(?, description), updated_at = ?
      WHERE code = ?`,
    data.price,
    data.isActive === undefined ? null : Number(data.isActive),
    data.isRecommended === undefined ? null : Number(data.isRecommended),
    data.description ?? null,
    new Date().toISOString(),
    data.code,
  );

  if (Number(existing.changes) === 0) return fail("not_found", "Тариф не найден.", 404);

  logAudit({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "plan.update",
    entityType: "plan",
    entityId: data.code,
    meta: { price: data.price, isActive: data.isActive },
  });

  return ok({ saved: true });
}
