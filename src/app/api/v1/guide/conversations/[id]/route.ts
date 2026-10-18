import { fail, ok, requireApiUser } from "@/lib/api";
import { getConversation } from "@/lib/guide";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const conversation = getConversation(auth.user.id, id);
  if (!conversation) return fail("not_found", "Диалог не найден.", 404);
  return ok({ conversation });
}

export const dynamic = "force-dynamic";
