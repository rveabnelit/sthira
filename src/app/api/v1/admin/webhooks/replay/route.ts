import { z } from "zod";
import { fail, ok, parseBody, requireApiAdmin } from "@/lib/api";
import { replayWebhook } from "@/lib/payments/service";
import { isApiError } from "@/lib/errors";
import { logAudit } from "@/lib/audit";

const schema = z.object({ externalId: z.string().min(4) });

export async function POST(request: Request) {
  const auth = await requireApiAdmin();
  if ("response" in auth) return auth.response;
  const parsed = await parseBody(request, schema);
  if (!parsed.success) return parsed.response;

  try {
    const result = replayWebhook(parsed.data.externalId);
    logAudit({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      action: "webhook.replay",
      entityType: "webhook_event",
      entityId: parsed.data.externalId,
      meta: { status: result.status },
    });
    return ok({ result });
  } catch (error) {
    if (isApiError(error)) return fail(error.code, error.message, error.status);
    return fail("replay_failed", "Не удалось повторить событие.", 500);
  }
}
