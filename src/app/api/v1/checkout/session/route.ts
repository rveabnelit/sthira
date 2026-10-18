import { z } from "zod";
import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { isApiError } from "@/lib/errors";
import { startCheckout } from "@/lib/payments/service";

const schema = z.object({ plan: z.enum(["practice", "guide", "live"], { message: "Выберите тариф." }) });

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const limit = rateLimit(`checkout:${auth.user.id}`, 8, 60 * 60 * 1000);
  if (!limit.allowed) {
    return fail("rate_limited", `Слишком много попыток оплаты. Повторите через ${limit.retryAfterSeconds} с.`, 429);
  }

  const parsed = await parseBody(request, schema);
  if (!parsed.success) return parsed.response;

  try {
    const result = startCheckout(auth.user.id, parsed.data.plan);
    return ok(
      {
        orderId: result.orderId,
        amount: result.amount,
        currency: result.currency,
        provider: result.provider,
        confirmationUrl: result.confirmationUrl,
        plan: { code: result.plan.code, name: result.plan.name },
      },
      201,
    );
  } catch (error) {
    if (isApiError(error)) return fail(error.code, error.message, error.status);
    console.error("[checkout] ошибка", error);
    return fail("checkout_failed", "Не удалось создать платёжную сессию. Попробуйте позже.", 500);
  }
}
