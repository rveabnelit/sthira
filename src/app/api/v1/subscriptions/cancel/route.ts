import { fail, ok, requireApiUser } from "@/lib/api";
import { isApiError } from "@/lib/errors";
import { cancelSubscription } from "@/lib/payments/service";

export async function POST() {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  try {
    const result = cancelSubscription(auth.user.id);
    return ok({ ...result, message: "Автопродление отменено. Доступ сохранится до конца оплаченного периода." });
  } catch (error) {
    if (isApiError(error)) return fail(error.code, error.message, error.status);
    return fail("cancel_failed", "Не удалось отменить подписку.", 500);
  }
}

export const dynamic = "force-dynamic";
