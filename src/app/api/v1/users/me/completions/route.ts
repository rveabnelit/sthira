import { ok, requireApiUser } from "@/lib/api";
import { getProgressStats, listCompletions } from "@/lib/data/progress";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);
  const completions = listCompletions(auth.user.id, limit, offset);
  return ok({ completions: completions.items, total: completions.total, stats: getProgressStats(auth.user.id) });
}

export const dynamic = "force-dynamic";
