import { fail, ok } from "@/lib/api";
import { isApiError } from "@/lib/errors";
import { listWebhookEvents, processWebhook } from "@/lib/payments/service";
import { WEBHOOK_SIGNATURE_HEADER } from "@/lib/payments/mock";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const raw = await request.text();
  if (!raw) return fail("empty_payload", "Пустое тело webhook.", 400);
  const signature = request.headers.get(WEBHOOK_SIGNATURE_HEADER);

  try {
    const result = processWebhook(raw, signature);
    return ok({ received: true, status: result.status, message: result.message });
  } catch (error) {
    if (isApiError(error)) {
      // Ошибка фиксируется в журнале webhook_events для расследования.
      console.warn("[webhook] отклонён", error.code, error.message);
      return fail(error.code, error.message, error.status);
    }
    console.error("[webhook] необработанная ошибка", error);
    return fail("webhook_failed", "Не удалось обработать уведомление.", 500);
  }
}

export async function GET() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEBUG_ENDPOINTS !== "true") {
    return fail("not_found", "Не найдено.", 404);
  }
  return ok({ events: listWebhookEvents(20) });
}
