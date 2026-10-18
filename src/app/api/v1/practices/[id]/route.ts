import { fail, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/session";
import { getPracticeById, relatedPractices } from "@/lib/data/practices";
import { getSubscription } from "@/lib/data/subscriptions";
import { canAccessPlan } from "@/lib/access";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const practice = getPracticeById(id, user?.id ?? null);
  if (!practice) return fail("not_found", "Практика не найдена.", 404);
  if (practice.status !== "published" && user?.role !== "admin") {
    return fail("not_found", "Практика не найдена.", 404);
  }
  const subscription = user ? getSubscription(user.id) : null;
  return ok({
    practice,
    locked: !canAccessPlan(subscription, practice.requiredPlan),
    related: relatedPractices(practice, 3),
  });
}

export const dynamic = "force-dynamic";
