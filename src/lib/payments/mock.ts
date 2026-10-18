import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getPlanByCode } from "@/lib/data/subscriptions";

/**
 * Тестовый платёжный провайдер («STHIRA Pay sandbox»).
 * Полностью повторяет контракт реального провайдера: создание платёжной сессии,
 * подписанный webhook, идемпотентная обработка. Реальные списания не производятся.
 */

export const MOCK_PROVIDER_ID = "mock";
export const WEBHOOK_SIGNATURE_HEADER = "x-sthira-signature";

export function webhookSecret(): string {
  return process.env.PAYMENT_WEBHOOK_SECRET || "sthira-dev-webhook-secret";
}

export type MockWebhookPayload = {
  event_id: string;
  type: "payment.succeeded" | "payment.failed";
  created_at: string;
  payment: {
    id: string;
    order_id: string;
    amount: number;
    currency: string;
    status: "succeeded" | "failed";
    paid_at: string;
    failure_reason?: string;
  };
};

export function signPayload(rawBody: string): string {
  return createHmac("sha256", webhookSecret()).update(rawBody, "utf8").digest("hex");
}

export function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = signPayload(rawBody);
  const provided = signature.trim().toLowerCase();
  if (provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export function createMockCheckout(input: {
  orderId: string;
  planCode: string;
  amount: number;
  currency: string;
}): { paymentId: string; confirmationUrl: string } {
  const paymentId = `mock_pay_${randomBytes(8).toString("hex")}`;
  const plan = getPlanByCode(input.planCode);
  const params = new URLSearchParams({
    order: input.orderId,
    payment: paymentId,
    amount: String(input.amount),
    plan: plan?.name ?? input.planCode,
  });
  return {
    paymentId,
    confirmationUrl: `/payment/mock?${params.toString()}`,
  };
}

export function createMockWebhookPayload(input: {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  outcome: "succeeded" | "failed";
  failureReason?: string;
}): MockWebhookPayload {
  return {
    event_id: `evt_${randomBytes(10).toString("hex")}`,
    type: input.outcome === "succeeded" ? "payment.succeeded" : "payment.failed",
    created_at: new Date().toISOString(),
    payment: {
      id: input.paymentId,
      order_id: input.orderId,
      amount: input.amount,
      currency: input.currency,
      status: input.outcome,
      paid_at: new Date().toISOString(),
      ...(input.failureReason ? { failure_reason: input.failureReason } : {}),
    },
  };
}

export const MOCK_FAILURE_REASONS = [
  "Недостаточно средств на тестовой карте",
  "Платёж отклонён тестовым провайдером",
];
