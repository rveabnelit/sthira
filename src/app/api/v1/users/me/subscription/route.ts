import { ok, requireApiUser } from "@/lib/api";
import { getSubscription, listPayments } from "@/lib/data/subscriptions";
import { isAccessActive, subscriptionStatusLabel } from "@/lib/access";

export async function GET() {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const subscription = getSubscription(auth.user.id);
  return ok({
    subscription,
    statusLabel: subscriptionStatusLabel(subscription),
    hasAccess: isAccessActive(subscription),
    payments: listPayments(auth.user.id),
  });
}

export const dynamic = "force-dynamic";
