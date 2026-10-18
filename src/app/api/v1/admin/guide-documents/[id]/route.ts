import { one, run } from "@/lib/db";
import { fail, ok, parseBody, requireApiAdmin } from "@/lib/api";
import { guideDocSchema } from "@/lib/admin-schemas";
import { logAudit } from "@/lib/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAdmin();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const existing = one<{ id: string; title: string }>("SELECT id, title FROM guide_documents WHERE id = ?", id);
  if (!existing) return fail("not_found", "Материал не найден.", 404);

  const parsed = await parseBody(request, guideDocSchema);
  if (!parsed.success) return parsed.response;

  run(
    "UPDATE guide_documents SET title = ?, category = ?, content = ?, status = ?, updated_at = ? WHERE id = ?",
    parsed.data.title,
    parsed.data.category,
    parsed.data.content,
    parsed.data.status,
    new Date().toISOString(),
    id,
  );

  logAudit({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "guide_document.update",
    entityType: "guide_document",
    entityId: id,
    meta: { title: parsed.data.title, status: parsed.data.status },
  });

  return ok({ id });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAdmin();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const existing = one<{ id: string; title: string }>("SELECT id, title FROM guide_documents WHERE id = ?", id);
  if (!existing) return fail("not_found", "Материал не найден.", 404);
  run("UPDATE guide_documents SET status = 'draft', updated_at = ? WHERE id = ?", new Date().toISOString(), id);
  logAudit({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "guide_document.unpublish",
    entityType: "guide_document",
    entityId: id,
    meta: { title: existing.title },
  });
  return ok({ published: false });
}
