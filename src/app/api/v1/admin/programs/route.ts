import { one, run, transaction } from "@/lib/db";
import { fail, ok, parseBody, requireApiAdmin } from "@/lib/api";
import { programInputSchema } from "@/lib/admin-schemas";
import { slugify, uniqueSlug } from "@/lib/slug";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const auth = await requireApiAdmin();
  if ("response" in auth) return auth.response;
  const parsed = await parseBody(request, programInputSchema);
  if (!parsed.success) return parsed.response;
  const data = parsed.data;

  const practiceIds = new Set(data.modules.flatMap((module) => module.lessons.map((lesson) => lesson.practiceId)));
  for (const practiceId of practiceIds) {
    if (!one<{ id: string }>("SELECT id FROM practices WHERE id = ?", practiceId)) {
      return fail("practice_not_found", "Одна из практик не найдена.", 422);
    }
  }

  const exists = (slug: string) => Boolean(one<{ id: string }>("SELECT id FROM programs WHERE slug = ?", slug));
  const slug = uniqueSlug(data.slug ? slugify(data.slug) : slugify(data.title), exists);
  const id = `pg_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  transaction(() => {
    run(
      `INSERT INTO programs (id, slug, title, short_description, description, thumbnail_url, cover_tone, difficulty,
         estimated_duration, lessons_per_week, audience, outcomes, required_plan, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
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
      now,
    );

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
    action: "program.create",
    entityType: "program",
    entityId: id,
    meta: { title: data.title, modules: data.modules.length },
  });

  return ok({ id, slug }, 201);
}
