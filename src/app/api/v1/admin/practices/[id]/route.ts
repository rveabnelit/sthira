import { one, run } from "@/lib/db";
import { fail, ok, parseBody, requireApiAdmin } from "@/lib/api";
import { practiceInputSchema } from "@/lib/admin-schemas";
import { slugify, uniqueSlug } from "@/lib/slug";
import { logAudit } from "@/lib/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAdmin();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const existing = one<{ id: string; slug: string }>("SELECT id, slug FROM practices WHERE id = ?", id);
  if (!existing) return fail("not_found", "Практика не найдена.", 404);

  const parsed = await parseBody(request, practiceInputSchema);
  if (!parsed.success) return parsed.response;
  const data = parsed.data;

  const exists = (slug: string) =>
    Boolean(one<{ id: string }>("SELECT id FROM practices WHERE slug = ? AND id <> ?", slug, id));
  const slug = data.slug && slugify(data.slug) !== existing.slug ? uniqueSlug(slugify(data.slug), exists) : existing.slug;

  run(
    `UPDATE practices SET slug = ?, title = ?, description = ?, teacher_note = ?, thumbnail_url = ?, cover_tone = ?,
            video_provider = ?, video_asset_id = ?, video_url = ?, duration_minutes = ?, difficulty = ?, goal = ?,
            tags = ?, required_plan = ?, status = ?, updated_at = ?
      WHERE id = ?`,
    slug,
    data.title,
    data.description,
    data.teacherNote ?? null,
    data.thumbnailUrl ?? null,
    data.coverTone,
    data.videoProvider,
    data.videoAssetId ?? null,
    data.videoUrl ?? null,
    data.durationMinutes,
    data.difficulty,
    data.goal,
    JSON.stringify(data.tags),
    data.requiredPlan,
    data.status,
    new Date().toISOString(),
    id,
  );

  logAudit({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "practice.update",
    entityType: "practice",
    entityId: id,
    meta: { title: data.title, status: data.status },
  });

  return ok({ id, slug });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAdmin();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const existing = one<{ id: string; title: string }>("SELECT id, title FROM practices WHERE id = ?", id);
  if (!existing) return fail("not_found", "Практика не найдена.", 404);

  // Мягкое удаление: практика остаётся в истории завершений и уроках программ.
  run("UPDATE practices SET status = 'archived', updated_at = ? WHERE id = ?", new Date().toISOString(), id);
  logAudit({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "practice.archive",
    entityType: "practice",
    entityId: id,
    meta: { title: existing.title },
  });
  return ok({ archived: true });
}
