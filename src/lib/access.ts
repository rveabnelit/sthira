import type { PlanCode } from "@/content/catalog";

export type SubscriptionStatus = "pending" | "active" | "canceled" | "expired" | "past_due";

export type SubscriptionView = {
  id: string;
  status: SubscriptionStatus;
  planCode: PlanCode;
  planName: string;
  price: number;
  periodStart: string | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  provider: string;
  providerSubscriptionId: string | null;
};

const PLAN_RANK: Record<PlanCode, number> = { practice: 1, guide: 2, live: 3 };

export function planRank(plan: PlanCode | string | null | undefined): number {
  if (!plan) return 0;
  return PLAN_RANK[plan as PlanCode] ?? 0;
}

/** Активна ли подписка с точки зрения доступа к контенту. */
export function isAccessActive(sub: SubscriptionView | null): boolean {
  if (!sub) return false;
  if (sub.status === "active") return true;
  if (sub.status === "canceled" || sub.status === "past_due") {
    return Boolean(sub.periodEnd && new Date(sub.periodEnd).getTime() > Date.now());
  }
  return false;
}

/** Есть ли доступ к контенту уровня requiredPlan. */
export function canAccessPlan(sub: SubscriptionView | null, requiredPlan: PlanCode | string): boolean {
  if (!isAccessActive(sub)) return false;
  return planRank(sub?.planCode) >= planRank(requiredPlan);
}

/** Публичное название состояния подписки. */
export function subscriptionStatusLabel(sub: SubscriptionView | null): string {
  if (!sub) return "Нет подписки";
  switch (sub.status) {
    case "active":
      return sub.cancelAtPeriodEnd ? "Автопродление отменено" : "Активна";
    case "canceled":
      return "Автопродление отменено";
    case "past_due":
      return "Платёж не прошёл";
    case "expired":
      return "Истекла";
    case "pending":
      return "Ожидает оплаты";
    default:
      return "Нет подписки";
  }
}

export function subscriptionTone(status: SubscriptionStatus | "none"): "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "active":
      return "success";
    case "canceled":
    case "pending":
    case "past_due":
      return "warning";
    case "expired":
      return "danger";
    default:
      return "neutral";
  }
}

export function requiredPlanLabel(plan: PlanCode | string): string {
  if (plan === "live") return "Live";
  if (plan === "guide") return "Guide";
  return "Practice";
}

export function daysLeft(periodEnd: string | null): number | null {
  if (!periodEnd) return null;
  const diff = new Date(periodEnd).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}
