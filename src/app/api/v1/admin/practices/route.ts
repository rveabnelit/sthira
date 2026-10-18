import { one, run } from "@/lib/db";
import { fail, ok, parseBody, requireApiAdmin } from "@/lib/api";
import { practiceInputSchema } from "@/lib/admin-schemas";
import { slugify, uniqueSlug } from "@/lib/slug";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const auth = await requireApiAdmin();
  if ("response" in auth) return auth.response;
  const parsed = await parseBody(request, practiceInputSchema);
  if (!parsed.success) return parsed.response;
  const data = parsed.data;

  const exists = (slug: string) => Boolean(one<{ id: string }>("SELECT id FROM practices WHERE slug = ?", slug));
  const slug = uniqueSlug(data.slug ? slugify(data.slug) : slugify(data.title), exists);
  const id = `pr_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  run(
    `INSERT INTO practices (id, slug, title, description, teacher_note, thumbnail_url, cover_tone,
       video_provider, video_asset_id, video_url, duration_minutes, difficulty, goal, tags,
       required_plan, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
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
    now,
    now,
  );

  logAudit({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "practice.create",
    entityType: "practice",
    entityId: id,
    meta: { title: data.title, status: data.status },
  });

  return ok({ id, slug }, 201);
}
