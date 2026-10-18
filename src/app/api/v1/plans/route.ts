import { ok } from "@/lib/api";
import { listPlans } from "@/lib/data/subscriptions";
import { getCurrentUser } from "@/lib/auth/session";
import { getSubscription } from "@/lib/data/subscriptions";

export async function GET() {
  const user = await getCurrentUser();
  const subscription = user ? getSubscription(user.id) : null;
  return ok({ plans: listPlans(), currentPlan: subscription?.planCode ?? null });
}

export const dynamic = "force-dynamic";
