import { one, run, transaction } from "@/lib/db";
import { fail, ok, parseBody, requireApiAdmin } from "@/lib/api";
import { programInputSchema } from "@/lib/admin-schemas";
import { slugify, uniqueSlug } from "@/lib/slug";
import { logAudit } from "@/lib/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAdmin();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const existing = one<{ id: string; slug: string }>("SELECT id, slug FROM programs WHERE id = ?", id);
  if (!existing) return fail("not_found", "Программа не найдена.", 404);

  const parsed = await parseBody(request, programInputSchema);
  if (!parsed.success) return parsed.response;
  const data = parsed.data;

  for (const module of data.modules) {
    for (const lesson of module.lessons) {
      if (!one<{ id: string }>("SELECT id FROM practices WHERE id = ?", lesson.practiceId)) {
        return fail("practice_not_found", "Одна из практик не найдена.", 422);
      }
    }
  }

  const exists = (slug: string) =>
    Boolean(one<{ id: string }>("SELECT id FROM programs WHERE slug = ? AND id <> ?", slug, id));
  const slug = data.slug && slugify(data.slug) !== existing.slug ? uniqueSlug(slugify(data.slug), exists) : existing.slug;
  const now = new Date().toISOString();

  transaction(() => {
    run(
      `UPDATE programs SET slug = ?, title = ?, short_description = ?, description = ?, cover_tone = ?, difficulty = ?,
              estimated_duration = ?, lessons_per_week = ?, audience = ?, outcomes = ?, required_plan = ?, status = ?,
              updated_at = ?
        WHERE id = ?`,
      slug,
      data.title,
      data.shortDescription,
      data.description,
      data.coverTone,
      data.difficulty,
      data.estimatedDuration,
      data.lessonsPerWeek,
      data.audience ?? null,
      JSON.stringify(data.outcomes),
      data.requiredPlan,
      data.status,
      now,
      id,
    );

    // Полная замена структуры: уроки связаны с модулями каскадно.
    run("DELETE FROM program_modules WHERE program_id = ?", id);
    data.modules.forEach((module, moduleIndex) => {
      const moduleId = `pm_${crypto.randomUUID()}`;
      run(
        "INSERT INTO program_modules (id, program_id, title, description, position) VALUES (?, ?, ?, ?, ?)",
        moduleId,
        id,
        module.title,
        module.description ?? null,
        moduleIndex + 1,
      );
      module.lessons.forEach((lesson, lessonIndex) => {
        run(
          "INSERT INTO program_lessons (id, module_id, practice_id, title, description, position) VALUES (?, ?, ?, ?, NULL, ?)",
          `ls_${crypto.randomUUID()}`,
          moduleId,
          lesson.practiceId,
          lesson.title,
          lessonIndex + 1,
        );
      });
    });
  });

  logAudit({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "program.update",
    entityType: "program",
    entityId: id,
    meta: { title: data.title, modules: data.modules.length },
  });

  return ok({ id, slug });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAdmin();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const existing = one<{ id: string; title: string }>("SELECT id, title FROM programs WHERE id = ?", id);
  if (!existing) return fail("not_found", "Программа не найдена.", 404);
  run("UPDATE programs SET status = 'archived', updated_at = ? WHERE id = ?", new Date().toISOString(), id);
  logAudit({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "program.archive",
    entityType: "program",
    entityId: id,
    meta: { title: existing.title },
  });
  return ok({ archived: true });
}
