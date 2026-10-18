import { ok, requireApiUser } from "@/lib/api";
import { listPayments } from "@/lib/data/subscriptions";

export async function GET() {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  return ok({ payments: listPayments(auth.user.id) });
}

export const dynamic = "force-dynamic";
