import { z } from "zod";
import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { getPracticeById } from "@/lib/data/practices";
import { saveWatchProgress } from "@/lib/data/player";

const schema = z.object({
  positionSeconds: z.number().min(0).max(6 * 60 * 60),
  durationSeconds: z.number().min(0).max(6 * 60 * 60),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  if (!getPracticeById(id)) return fail("not_found", "Практика не найдена.", 404);
  const parsed = await parseBody(request, schema);
  if (!parsed.success) return parsed.response;
  saveWatchProgress({
    userId: auth.user.id,
    practiceId: id,
    positionSeconds: parsed.data.positionSeconds,
    durationSeconds: parsed.data.durationSeconds,
  });
  return ok({ saved: true });
}

export const dynamic = "force-dynamic";
