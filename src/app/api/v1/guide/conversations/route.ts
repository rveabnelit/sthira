import { ok, requireApiUser } from "@/lib/api";
import { getConversation, listConversations } from "@/lib/guide";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const id = new URL(request.url).searchParams.get("id");
  if (id) {
    const conversation = getConversation(auth.user.id, id);
    if (!conversation) return ok({ conversation: null });
    return ok({ conversation });
  }
  return ok({ conversations: listConversations(auth.user.id) });
}

export const dynamic = "force-dynamic";
