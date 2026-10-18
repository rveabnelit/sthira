import { z } from "zod";
import { all, one, run, transaction } from "@/lib/db";
import { getPlanById, getPlanByCode, getSubscription } from "@/lib/data/subscriptions";
import { createMockCheckout, createMockWebhookPayload, MOCK_PROVIDER_ID, signPayload, verifySignature } from "@/lib/payments/mock";
import { ApiError } from "@/lib/errors";
import { trackEvent } from "@/lib/analytics";

const PERIOD_DAYS = 30;

export function startCheckout(userId: string, planCode: string, baseUrl?: string) {
  const plan = getPlanByCode(planCode);
  if (!plan || !plan.isActive) {
    throw new ApiError("plan_unavailable", "Этот тариф сейчас недоступен.", 400);
  }
  if (plan.price <= 0) {
    throw new ApiError("plan_price", "Для тарифа не настроена цена. Обратитесь в поддержку.", 400);
  }

  const orderId = crypto.randomUUID();
  const now = new Date().toISOString();
  run(
    `INSERT INTO checkout_orders (id, user_id, plan_id, amount, currency, status, provider, created_at)
     VALUES (?, ?, ?, ?, ?, 'created', ?, ?)`,
    orderId,
    userId,
    plan.id,
    plan.price,
    plan.currency,
    MOCK_PROVIDER_ID,
    now,
  );

  const checkout = createMockCheckout({
    orderId,
    planCode: plan.code,
    amount: plan.price,
    currency: plan.currency,
  });

  run(
    "UPDATE checkout_orders SET status = 'pending', provider_order_id = ? WHERE id = ?",
    checkout.paymentId,
    orderId,
  );

  trackEvent("checkout_started", { userId, props: { plan: plan.code, amount: plan.price, orderId } });

  return {
    orderId,
    plan,
    amount: plan.price,
    currency: plan.currency,
    confirmationUrl: checkout.confirmationUrl,
    provider: MOCK_PROVIDER_ID,
    baseUrl,
  };
}

export function mockConfirmCheckout(input: {
  orderId: string;
  paymentId: string;
  outcome: "succeeded" | "failed";
}): { alreadyPaid?: boolean; outcome?: "succeeded"; status?: string; message?: string } {
  const order = one<{ id: string; amount: number; currency: string; status: string }>(
    "SELECT id, amount, currency, status FROM checkout_orders WHERE id = ?",
    input.orderId,
  );
  if (!order) throw new ApiError("order_not_found", "Заказ не найден.", 404);
  if (order.status === "paid") {
    return { alreadyPaid: true, outcome: "succeeded" as const };
  }
  const payload = createMockWebhookPayload({
    paymentId: input.paymentId,
    orderId: order.id,
    amount: Number(order.amount),
    currency: order.currency,
    outcome: input.outcome,
    failureReason: input.outcome === "failed" ? "Тестовый платёж отклонён" : undefined,
  });
  const raw = JSON.stringify(payload);

  return processWebhook(raw, signPayload(raw));
}

const webhookSchema = z.object({
  event_id: z.string().min(6),
  type: z.enum(["payment.succeeded", "payment.failed"]),
  created_at: z.string(),
  payment: z.object({
    id: z.string().min(3),
    order_id: z.string().min(3),
    amount: z.number().int().nonnegative(),
    currency: z.string().min(3),
    status: z.enum(["succeeded", "failed"]),
    paid_at: z.string(),
    failure_reason: z.string().optional(),
  }),
});

export type WebhookResult = {
  status: "processed" | "duplicate" | "failed";
  message?: string;
};

export function processWebhook(rawBody: string, signature: string | null): WebhookResult {
  if (!verifySignature(rawBody, signature)) {
    throw new ApiError("invalid_signature", "Подпись webhook не совпадает.", 401);
  }
  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    throw new ApiError("invalid_payload", "Некорректный JSON в webhook.", 400);
  }
  const parsed = webhookSchema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError("invalid_payload", "Webhook не соответствует схеме.", 422);
  }
  const payload = parsed.data;

  const inserted = one<{ id: string }>(
    `INSERT OR IGNORE INTO webhook_events (id, provider, external_id, signature_valid, payload, received_at)
     VALUES (?, ?, ?, 1, ?, ?) RETURNING id`,
    crypto.randomUUID(),
    MOCK_PROVIDER_ID,
    payload.event_id,
    rawBody,
    new Date().toISOString(),
  );

  if (!inserted) {
    // Событие уже приходило: повторная обработка не должна менять состояние.
    const existing = one<{ result: string | null; processed_at: string | null }>(
      "SELECT result, processed_at FROM webhook_events WHERE external_id = ?",
      payload.event_id,
    );
    if (existing?.processed_at) {
      return { status: "duplicate", message: "Событие уже обработано." };
    }
    // предыдущая обработка упала — пробуем ещё раз
  }

  try {
    const result = transaction(() => {
      if (payload.type === "payment.succeeded") {
        return handleSuccessfulPayment(payload);
      }
      return handleFailedPayment(payload);
    });
    run(
      "UPDATE webhook_events SET result = ?, processed_at = ? WHERE external_id = ?",
      JSON.stringify(result),
      new Date().toISOString(),
      payload.event_id,
    );
    return { status: "processed", message: result.message };
  } catch (error) {
    run(
      "UPDATE webhook_events SET result = ? WHERE external_id = ?",
      JSON.stringify({ error: error instanceof Error ? error.message : "unknown" }),
      payload.event_id,
    );
    throw error;
  }
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function handleSuccessfulPayment(payload: z.infer<typeof webhookSchema>): { message: string; duplicate?: boolean } {
  const { payment } = payload;
  const order = one<{
    id: string;
    user_id: string;
    plan_id: string;
    amount: number;
    currency: string;
    status: string;
  }>("SELECT id, user_id, plan_id, amount, currency, status FROM checkout_orders WHERE id = ?", payment.order_id);

  if (!order) throw new ApiError("order_not_found", "Заказ из webhook не найден.", 404);

  // Подпись проверена, но сумма должна совпасть с заказом — защита от подмены.
  if (Number(order.amount) !== payment.amount || order.currency !== payment.currency) {
    throw new ApiError("amount_mismatch", "Сумма платежа не совпадает с заказом.", 409);
  }
  if (order.status === "paid") {
    return { message: "Заказ уже оплачен", duplicate: true };
  }

  const plan = getPlanById(order.plan_id);
  if (!plan) throw new ApiError("plan_not_found", "Тариф заказа не найден.", 404);

  const now = new Date();
  const existing = one<{
    id: string;
    plan_id: string;
    status: string;
    current_period_end: string | null;
  }>(
    "SELECT id, plan_id, status, current_period_end FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
    order.user_id,
  );

  let subscriptionId: string;
  let periodEnd: Date;

  if (existing && ["active", "canceled", "past_due"].includes(existing.status)) {
    const currentEnd = existing.current_period_end ? new Date(existing.current_period_end) : now;
    const base = currentEnd.getTime() > now.getTime() ? currentEnd : now;
    periodEnd = addDays(base, PERIOD_DAYS);
    if (existing.plan_id === order.plan_id) {
      run(
        `UPDATE subscriptions
            SET status = 'active', cancel_at_period_end = 0, canceled_at = NULL,
                current_period_end = ?, updated_at = ?
          WHERE id = ?`,
        periodEnd.toISOString(),
        now.toISOString(),
        existing.id,
      );
      subscriptionId = existing.id;
    } else {
      run("UPDATE subscriptions SET status = 'expired', updated_at = ? WHERE id = ?", now.toISOString(), existing.id);
      subscriptionId = createSubscription(order.user_id, order.plan_id, now, periodEnd, payload.payment.id);
    }
  } else {
    periodEnd = addDays(now, PERIOD_DAYS);
    subscriptionId = createSubscription(order.user_id, order.plan_id, now, periodEnd, payload.payment.id);
  }

  const paymentId = `pay_${crypto.randomUUID()}`;
  run(
    `INSERT INTO payments (id, user_id, subscription_id, order_id, plan_id, provider, provider_payment_id,
                           amount, currency, status, paid_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'succeeded', ?, ?)`,
    paymentId,
    order.user_id,
    subscriptionId,
    order.id,
    order.plan_id,
    MOCK_PROVIDER_ID,
    payment.id,
    payment.amount,
    payment.currency,
    payment.paid_at,
    now.toISOString(),
  );
  run(
    "UPDATE checkout_orders SET status = 'paid', paid_at = ?, payment_id = ? WHERE id = ?",
    payment.paid_at,
    paymentId,
    order.id,
  );
  run(
    "UPDATE webhook_events SET result = ? WHERE external_id = ?",
    JSON.stringify({ paymentId, subscriptionId }),
    payload.event_id,
  );

  notify(order.user_id, "subscription", "Подписка активирована", `Тариф ${plan.name} активен до ${periodEnd.toLocaleDateString("ru-RU")}.`, "/app/subscription");

  trackEvent("payment_succeeded", {
    userId: order.user_id,
    props: { plan: plan.code, amount: payment.amount, orderId: order.id, paymentId },
  });

  return { message: "Подписка активирована" };
}

function createSubscription(userId: string, planId: string, start: Date, end: Date, paymentRef: string): string {
  const id = `sub_${crypto.randomUUID()}`;
  run(
    `INSERT INTO subscriptions (id, user_id, plan_id, provider, provider_subscription_id, status,
                                started_at, current_period_start, current_period_end, cancel_at_period_end,
                                created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, 0, ?, ?)`,
    id,
    userId,
    planId,
    MOCK_PROVIDER_ID,
    `mock_sub_${paymentRef}`,
    start.toISOString(),
    start.toISOString(),
    end.toISOString(),
    start.toISOString(),
    start.toISOString(),
  );
  return id;
}

function handleFailedPayment(payload: z.infer<typeof webhookSchema>): { message: string } {
  const { payment } = payload;
  const order = one<{ id: string; user_id: string; plan_id: string; amount: number; currency: string }>(
    "SELECT id, user_id, plan_id, amount, currency FROM checkout_orders WHERE id = ?",
    payment.order_id,
  );
  if (!order) throw new ApiError("order_not_found", "Заказ из webhook не найден.", 404);

  const duplicate = one<{ id: string }>("SELECT id FROM payments WHERE provider_payment_id = ?", payment.id);
  if (duplicate) {
    return { message: "Платёж уже обработан" };
  }

  run(
    "UPDATE checkout_orders SET status = 'failed' WHERE id = ? AND status <> 'paid'",
    order.id,
  );
  run(
    `INSERT INTO payments (id, user_id, subscription_id, order_id, plan_id, provider, provider_payment_id,
                           amount, currency, status, failure_reason, created_at)
     VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, 'failed', ?, ?)`,
    `pay_${crypto.randomUUID()}`,
    order.user_id,
    order.id,
    order.plan_id,
    MOCK_PROVIDER_ID,
    payment.id,
    payment.amount,
    payment.currency,
    payment.failure_reason ?? "Платёж отклонён",
    new Date().toISOString(),
  );

  const sub = getSubscription(order.user_id);
  if (sub && ["active", "canceled"].includes(sub.status)) {
    run("UPDATE subscriptions SET status = 'past_due', updated_at = ? WHERE id = ?", new Date().toISOString(), sub.id);
  }

  notify(
    order.user_id,
    "payment",
    "Платёж не прошёл",
    "Средства не списаны. Проверьте способ оплаты или попробуйте снова — доступ сохранится до конца оплаченного периода.",
    "/app/subscription",
  );

  trackEvent("payment_failed", { userId: order.user_id, props: { orderId: order.id, amount: payment.amount } });

  return { message: "Платёж отмечен как неуспешный" };
}

export function notify(userId: string, type: string, title: string, body: string, href?: string) {
  run(
    `INSERT INTO notifications (id, user_id, type, title, body, href, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    `ntf_${crypto.randomUUID()}`,
    userId,
    type,
    title,
    body,
    href ?? null,
    new Date().toISOString(),
  );
}

export function cancelSubscription(userId: string): { status: string; accessUntil: string | null } {
  const sub = getSubscription(userId);
  if (!sub) throw new ApiError("no_subscription", "Активная подписка не найдена.", 404);
  if (sub.status === "expired") throw new ApiError("expired", "Подписка уже завершена.", 409);
  if (sub.status === "pending") throw new ApiError("pending", "Подписка ещё не активирована.", 409);

  const now = new Date().toISOString();
  run(
    "UPDATE subscriptions SET cancel_at_period_end = 1, status = 'canceled', canceled_at = ?, updated_at = ? WHERE id = ?",
    now,
    now,
    sub.id,
  );
  run(
    "UPDATE subscriptions SET status = 'expired', updated_at = ? WHERE user_id = ? AND id <> ? AND status IN ('active', 'pending')",
    now,
    userId,
    sub.id,
  );
  notify(
    userId,
    "subscription",
    "Автопродление отменено",
    `Доступ сохранится до ${new Date(sub.periodEnd ?? now).toLocaleDateString("ru-RU")}. После этой даты продление не произойдёт.`,
    "/app/subscription",
  );
  trackEvent("subscription_cancelled", { userId, props: { plan: sub.planCode } });
  return { status: "canceled", accessUntil: sub.periodEnd };
}

export function resumeSubscription(userId: string) {
  const sub = getSubscription(userId);
  if (!sub) throw new ApiError("no_subscription", "Подписка не найдена.", 404);
  if (sub.status !== "canceled") throw new ApiError("not_canceled", "Автопродление не отменено.", 409);
  if (sub.periodEnd && new Date(sub.periodEnd).getTime() <= Date.now()) {
    throw new ApiError("expired", "Оплаченный период уже завершён. Оформите подписку заново.", 409);
  }
  run(
    "UPDATE subscriptions SET status = 'active', cancel_at_period_end = 0, canceled_at = NULL, updated_at = ? WHERE id = ?",
    new Date().toISOString(),
    sub.id,
  );
  return { status: "active" };
}

/** Повторная обработка сохранённого события — для проверки идемпотентности в админке. */
export function replayWebhook(externalId: string) {
  const event = one<{ payload: string }>("SELECT payload FROM webhook_events WHERE external_id = ?", externalId);
  if (!event) throw new ApiError("event_not_found", "Событие не найдено.", 404);

  return processWebhook(event.payload, signPayload(event.payload));
}

export function listWebhookEvents(limit = 20) {
  return all<{ external_id: string; result: string | null; received_at: string; processed_at: string | null; signature_valid: number }>(
    "SELECT external_id, result, received_at, processed_at, signature_valid FROM webhook_events ORDER BY received_at DESC LIMIT ?",
    limit,
  );
}

