import { one, run } from "@/lib/db";
import { fail, ok, parseBody, requireApiAdmin } from "@/lib/api";
import { liveSessionSchema } from "@/lib/admin-schemas";
import { logAudit } from "@/lib/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAdmin();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const existing = one<{ id: string; title: string }>("SELECT id, title FROM live_sessions WHERE id = ?", id);
  if (!existing) return fail("not_found", "Занятие не найдено.", 404);

  const parsed = await parseBody(request, liveSessionSchema);
  if (!parsed.success) return parsed.response;
  const data = parsed.data;

  run(
    `UPDATE live_sessions SET title = ?, description = ?, starts_at = ?, duration_minutes = ?, capacity = ?,
            join_url = ?, status = ?, updated_at = ?
      WHERE id = ?`,
    data.title,
    data.description,
    new Date(data.startsAt).toISOString(),
    data.durationMinutes,
    data.capacity,
    data.joinUrl ?? null,
    data.status,
    new Date().toISOString(),
    id,
  );

  logAudit({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "live_session.update",
    entityType: "live_session",
    entityId: id,
    meta: { title: data.title, status: data.status },
  });

  return ok({ id });
}
