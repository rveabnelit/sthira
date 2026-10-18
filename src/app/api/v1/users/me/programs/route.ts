import { ok, requireApiUser } from "@/lib/api";
import { listUserPrograms } from "@/lib/data/programs";
import { getSubscription } from "@/lib/data/subscriptions";
import { canAccessPlan } from "@/lib/access";

export async function GET() {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const subscription = getSubscription(auth.user.id);
  return ok({ programs: listUserPrograms(auth.user.id, canAccessPlan(subscription, "practice")) });
}

export const dynamic = "force-dynamic";
