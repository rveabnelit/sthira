import { z } from "zod";
import { one } from "@/lib/db";
import { fail, getClientIp, ok, parseBody, requireApiUser } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { DEMO_MODE } from "@/lib/email";
import { isApiError } from "@/lib/errors";
import { mockConfirmCheckout } from "@/lib/payments/service";

const schema = z.object({
  orderId: z.string().min(4),
  paymentId: z.string().min(4),
  outcome: z.enum(["succeeded", "failed"]),
});

/**
 * Имитация страницы тестового провайдера. Реальный провайдер вызывает webhook
 * самостоятельно; здесь подтверждение проходит тот же подписанный сценарий.
 */
export async function POST(request: Request) {
  if (!DEMO_MODE) return fail("not_found", "Не найдено.", 404);
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const limit = rateLimit(`mock-pay:${auth.user.id}`, 20, 60 * 60 * 1000);
  if (!limit.allowed) return fail("rate_limited", "Слишком много попыток.", 429);

  const parsed = await parseBody(request, schema);
  if (!parsed.success) return parsed.response;

  const order = one<{ id: string; user_id: string; status: string }>(
    "SELECT id, user_id, status FROM checkout_orders WHERE id = ?",
    parsed.data.orderId,
  );
  if (!order || order.user_id !== auth.user.id) {
    return fail("order_not_found", "Заказ не найден.", 404);
  }

  try {
    const result = mockConfirmCheckout({
      orderId: parsed.data.orderId,
      paymentId: parsed.data.paymentId,
      outcome: parsed.data.outcome,
    });
    const redirectTo =
      parsed.data.outcome === "succeeded"
        ? `/payment/success?order=${parsed.data.orderId}`
        : `/payment/failure?order=${parsed.data.orderId}`;
    return ok({ redirectTo, status: result.status ?? "processed", alreadyPaid: Boolean(result.alreadyPaid) });
  } catch (error) {
    if (isApiError(error)) return fail(error.code, error.message, error.status);
    console.error("[mock-pay] ошибка", error);
    return fail("payment_failed", "Тестовый платёж не обработан.", 500);
  }
}
