import { ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/session";
import { getSubscription } from "@/lib/data/subscriptions";
import { canAccessPlan } from "@/lib/access";
import { listPractices } from "@/lib/data/practices";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const user = await getCurrentUser();
  const subscription = user ? getSubscription(user.id) : null;
  const status = url.searchParams.get("status");
  const result = listPractices({
    q: url.searchParams.get("q") ?? undefined,
    goal: url.searchParams.get("goal") ?? undefined,
    difficulty: url.searchParams.get("difficulty") ?? undefined,
    duration: url.searchParams.get("duration") ?? undefined,
    tag: url.searchParams.get("tag") ?? undefined,
    sort: (url.searchParams.get("sort") as "recommended" | "newest" | "popular" | "shortest") ?? "recommended",
    limit: Number(url.searchParams.get("limit") ?? 24),
    offset: Number(url.searchParams.get("offset") ?? 0),
    userId: user?.id ?? null,
    status: status ? status.split(",") : ["published"],
  });

  return ok({
    practices: result.items.map((practice) => ({
      ...practice,
      locked: !canAccessPlan(subscription, practice.requiredPlan),
    })),
    total: result.total,
  });
}

export const dynamic = "force-dynamic";
