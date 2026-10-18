import { run } from "@/lib/db";
import { ok, parseBody, requireApiAdmin } from "@/lib/api";
import { liveSessionSchema } from "@/lib/admin-schemas";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const auth = await requireApiAdmin();
  if ("response" in auth) return auth.response;
  const parsed = await parseBody(request, liveSessionSchema);
  if (!parsed.success) return parsed.response;
  const data = parsed.data;
  const id = `live_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  run(
    `INSERT INTO live_sessions (id, title, description, teacher_name, starts_at, duration_minutes, capacity,
       join_url, cover_url, required_plan, status, created_at, updated_at)
     VALUES (?, ?, ?, 'Мария Васильева', ?, ?, ?, ?, NULL, 'live', ?, ?, ?)`,
    id,
    data.title,
    data.description,
    new Date(data.startsAt).toISOString(),
    data.durationMinutes,
    data.capacity,
    data.joinUrl ?? null,
    data.status,
    now,
    now,
  );

  logAudit({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "live_session.create",
    entityType: "live_session",
    entityId: id,
    meta: { title: data.title, startsAt: data.startsAt },
  });

  return ok({ id }, 201);
}
