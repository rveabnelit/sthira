import { fail, ok, requireApiUser } from "@/lib/api";
import { isApiError } from "@/lib/errors";
import { resumeSubscription } from "@/lib/payments/service";

export async function POST() {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  try {
    return ok(resumeSubscription(auth.user.id));
  } catch (error) {
    if (isApiError(error)) return fail(error.code, error.message, error.status);
    return fail("resume_failed", "Не удалось возобновить подписку.", 500);
  }
}

export const dynamic = "force-dynamic";
