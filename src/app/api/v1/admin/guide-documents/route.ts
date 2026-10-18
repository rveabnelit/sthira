import { one, run } from "@/lib/db";
import { ok, parseBody, requireApiAdmin } from "@/lib/api";
import { guideDocSchema } from "@/lib/admin-schemas";
import { slugify, uniqueSlug } from "@/lib/slug";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const auth = await requireApiAdmin();
  if ("response" in auth) return auth.response;
  const parsed = await parseBody(request, guideDocSchema);
  if (!parsed.success) return parsed.response;

  const exists = (slug: string) => Boolean(one<{ id: string }>("SELECT id FROM guide_documents WHERE slug = ?", slug));
  const slug = uniqueSlug(slugify(parsed.data.title), exists);
  const id = `kb_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  run(
    `INSERT INTO guide_documents (id, slug, title, category, content, status, updated_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    slug,
    parsed.data.title,
    parsed.data.category,
    parsed.data.content,
    parsed.data.status,
    now,
    now,
  );

  logAudit({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "guide_document.create",
    entityType: "guide_document",
    entityId: id,
    meta: { title: parsed.data.title, status: parsed.data.status },
  });

  return ok({ id, slug }, 201);
}
