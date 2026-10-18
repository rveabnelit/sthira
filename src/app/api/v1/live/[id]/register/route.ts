import { fail, ok, requireApiUser } from "@/lib/api";
import { getSubscription } from "@/lib/data/subscriptions";
import { canAccessPlan } from "@/lib/access";
import { registerForSession, unregisterFromSession } from "@/lib/data/live";
import { trackEvent } from "@/lib/analytics";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const subscription = getSubscription(auth.user.id);
  if (!canAccessPlan(subscription, "live")) {
    return fail("subscription_required", "Онлайн-занятия доступны на тарифе Live.", 403);
  }
  const result = registerForSession(auth.user.id, id);
  if (!result.ok) {
    const messages = {
      not_found: "Занятие не найдено.",
      canceled: "Занятие отменено.",
      full: "Свободных мест больше нет.",
    };
    return fail(result.reason, messages[result.reason], result.reason === "not_found" ? 404 : 409);
  }
  trackEvent("live_registered", { userId: auth.user.id, props: { sessionId: id } });
  return ok({ registered: true }, 201);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  unregisterFromSession(auth.user.id, id);
  return ok({ registered: false });
}

export const dynamic = "force-dynamic";
