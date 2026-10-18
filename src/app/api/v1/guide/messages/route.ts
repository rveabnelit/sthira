import { z } from "zod";
import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { getSubscription } from "@/lib/data/subscriptions";
import { canAccessPlan } from "@/lib/access";
import { GUIDE_MAX_MESSAGE_LENGTH, guideMessagesLeft, sendGuideMessage } from "@/lib/guide";
import { rateLimit } from "@/lib/rate-limit";
import { isApiError } from "@/lib/errors";

const schema = z.object({
  message: z.string().trim().min(1, "Введите вопрос.").max(GUIDE_MAX_MESSAGE_LENGTH, "Сообщение слишком длинное."),
  conversationId: z.string().min(3).optional().nullable(),
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const subscription = getSubscription(auth.user.id);
  if (!canAccessPlan(subscription, "guide")) {
    return fail("subscription_required", "STHIRA Guide доступен на тарифе Guide и выше.", 403);
  }

  const limit = rateLimit(`guide:${auth.user.id}`, 10, 60 * 1000);
  if (!limit.allowed) {
    return fail("rate_limited", `Слишком часто. Подождите ${limit.retryAfterSeconds} с.`, 429);
  }

  const parsed = await parseBody(request, schema);
  if (!parsed.success) return parsed.response;

  try {
    const result = sendGuideMessage({
      userId: auth.user.id,
      conversationId: parsed.data.conversationId ?? null,
      message: parsed.data.message,
      subscription,
    });
    return ok({
      conversationId: result.conversationId,
      messages: result.messages,
      practices: result.answer.practices.map((practice) => ({
        id: practice.id,
        slug: practice.slug,
        title: practice.title,
        durationMinutes: practice.durationMinutes,
        difficulty: practice.difficulty,
        tone: practice.coverTone,
      })),
      safety: result.answer.safety,
      messagesLeft: guideMessagesLeft(auth.user.id),
      demoProvider: true,
    });
  } catch (error) {
    if (isApiError(error)) return fail(error.code, error.message, error.status);
    console.error("[guide] ошибка", error);
    return fail("guide_unavailable", "Наставник временно недоступен. Остальные разделы работают.", 503);
  }
}

export const dynamic = "force-dynamic";
