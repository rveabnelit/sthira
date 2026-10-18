import { one, run } from "@/lib/db";
import { fail, ok, requireApiAdmin } from "@/lib/api";
import { logAudit } from "@/lib/audit";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAdmin();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const session = one<{ id: string; title: string }>("SELECT id, title FROM live_sessions WHERE id = ?", id);
  if (!session) return fail("not_found", "Занятие не найдено.", 404);

  run("UPDATE live_sessions SET status = 'canceled', updated_at = ? WHERE id = ?", new Date().toISOString(), id);
  logAudit({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "live_session.cancel",
    entityType: "live_session",
    entityId: id,
    meta: { title: session.title },
  });

  return ok({ canceled: true });
}
