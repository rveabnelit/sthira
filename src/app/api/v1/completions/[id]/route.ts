import { z } from "zod";
import { one, run } from "@/lib/db";
import { fail, ok, parseBody, requireApiUser } from "@/lib/api";

const schema = z.object({ mood: z.string().max(40).nullable() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const parsed = await parseBody(request, schema);
  if (!parsed.success) return parsed.response;

  const completion = one<{ id: string }>(
    "SELECT id FROM practice_completions WHERE id = ? AND user_id = ?",
    id,
    auth.user.id,
  );
  if (!completion) return fail("not_found", "Завершение не найдено.", 404);

  run("UPDATE practice_completions SET mood = ? WHERE id = ?", parsed.data.mood, id);
  return ok({ mood: parsed.data.mood });
}

export const dynamic = "force-dynamic";
