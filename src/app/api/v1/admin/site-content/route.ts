import { ok, parseBody, requireApiAdmin } from "@/lib/api";
import { siteContentSchema } from "@/lib/admin-schemas";
import { updateSiteContent } from "@/lib/content";
import { logAudit } from "@/lib/audit";

export async function PUT(request: Request) {
  const auth = await requireApiAdmin();
  if ("response" in auth) return auth.response;
  const parsed = await parseBody(request, siteContentSchema);
  if (!parsed.success) return parsed.response;
  updateSiteContent(parsed.data.entries);
  logAudit({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "site_content.update",
    entityType: "site_content",
    entityId: null,
    meta: { keys: Object.keys(parsed.data.entries) },
  });
  return ok({ saved: true });
}
