import { all, one, run } from "@/lib/db";
import { parseList } from "@/lib/data/programs";
import type { PlanCode } from "@/content/catalog";
import type { Payment, Plan } from "@/lib/types";
import type { SubscriptionStatus, SubscriptionView } from "@/lib/access";

type PlanRow = {
  id: string;
  code: PlanCode;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_period: string;
  features: string;
  is_active: number;
  is_recommended: number;
};

export function mapPlan(row: PlanRow): Plan {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    currency: row.currency,
    billingPeriod: row.billing_period,
    features: parseList(row.features),
    isActive: Number(row.is_active) === 1,
    isRecommended: Number(row.is_recommended) === 1,
  };
}

export function listPlans(includeInactive = false): Plan[] {
  const rows = all<PlanRow>(
    `SELECT * FROM plans ${includeInactive ? "" : "WHERE is_active = 1"} ORDER BY sort_order ASC`,
  );
  return rows.map(mapPlan);
}

export function getPlanByCode(code: string): Plan | null {
  const row = one<PlanRow>("SELECT * FROM plans WHERE code = ?", code);
  return row ? mapPlan(row) : null;
}

export function getPlanById(id: string): Plan | null {
  const row = one<PlanRow>("SELECT * FROM plans WHERE id = ?", id);
  return row ? mapPlan(row) : null;
}

type SubscriptionRow = {
  id: string;
  status: SubscriptionStatus;
  plan_code: PlanCode;
  plan_name: string;
  price: number;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: number;
  provider: string;
  provider_subscription_id: string | null;
};

function mapSubscription(row: SubscriptionRow): SubscriptionView {
  return {
    id: row.id,
    status: row.status,
    planCode: row.plan_code,
    planName: row.plan_name,
    price: Number(row.price),
    periodStart: row.current_period_start,
    periodEnd: row.current_period_end,
    cancelAtPeriodEnd: Number(row.cancel_at_period_end) === 1,
    provider: row.provider,
    providerSubscriptionId: row.provider_subscription_id,
  };
}

/** Возвращает актуальную подписку, помечая истёкшие периоды. */
export function getSubscription(userId: string): SubscriptionView | null {
  const row = one<SubscriptionRow>(
    `SELECT s.id, s.status, p.code AS plan_code, p.name AS plan_name, p.price,
            s.current_period_start, s.current_period_end, s.cancel_at_period_end,
            s.provider, s.provider_subscription_id
       FROM subscriptions s
       JOIN plans p ON p.id = s.plan_id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
      LIMIT 1`,
    userId,
  );
  if (!row) return null;
  const view = mapSubscription(row);
  const end = view.periodEnd ? new Date(view.periodEnd).getTime() : null;
  if (end !== null && end <= Date.now() && view.status !== "expired" && view.status !== "pending") {
    run("UPDATE subscriptions SET status = 'expired', updated_at = ? WHERE id = ?", new Date().toISOString(), row.id);
    return { ...view, status: "expired" };
  }
  return view;
}

type PaymentRow = {
  id: string;
  amount: number;
  currency: string;
  status: Payment["status"];
  paid_at: string | null;
  created_at: string;
  failure_reason: string | null;
  provider_payment_id: string;
  plan_name: string | null;
};

export function listPayments(userId: string): Payment[] {
  return all<PaymentRow>(
    `SELECT pay.id, pay.amount, pay.currency, pay.status, pay.paid_at, pay.created_at,
            pay.failure_reason, pay.provider_payment_id, pl.name AS plan_name
       FROM payments pay
       LEFT JOIN plans pl ON pl.id = pay.plan_id
      WHERE pay.user_id = ?
      ORDER BY pay.created_at DESC`,
    userId,
  ).map((row) => ({
    id: row.id,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    planName: row.plan_name,
    providerPaymentId: row.provider_payment_id,
    failureReason: row.failure_reason,
  }));
}

export function listOrdersForUser(userId: string) {
  return all<{ id: string; amount: number; status: string; created_at: string; plan_name: string }>(
    `SELECT o.id, o.amount, o.status, o.created_at, pl.name AS plan_name
       FROM checkout_orders o JOIN plans pl ON pl.id = o.plan_id
      WHERE o.user_id = ? ORDER BY o.created_at DESC LIMIT 10`,
    userId,
  );
}
