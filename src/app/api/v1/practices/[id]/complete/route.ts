import { z } from "zod";
import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { getPracticeById } from "@/lib/data/practices";
import { getSubscription } from "@/lib/data/subscriptions";
import { canAccessPlan } from "@/lib/access";
import { completePractice } from "@/lib/data/progress";
import { one } from "@/lib/db";
import { trackEvent } from "@/lib/analytics";

const schema = z.object({
  programLessonId: z.string().min(3).optional().nullable(),
  durationSeconds: z.number().int().min(0).max(24 * 60 * 60).optional().nullable(),
  mood: z.string().max(40).optional().nullable(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const practice = getPracticeById(id);
  if (!practice || practice.status !== "published") return fail("not_found", "Практика не найдена.", 404);

  const parsed = await parseBody(request, schema);
  if (!parsed.success) return parsed.response;

  const subscription = getSubscription(auth.user.id);
  if (!canAccessPlan(subscription, practice.requiredPlan)) {
    return fail("subscription_required", "Для завершения практики нужен доступ по подписке.", 403);
  }

  let lessonId = parsed.data.programLessonId ?? null;
  if (lessonId) {
    const lesson = one<{ id: string; practice_id: string }>(
      "SELECT id, practice_id FROM program_lessons WHERE id = ?",
      lessonId,
    );
    if (!lesson || lesson.practice_id !== practice.id) {
      return fail("invalid_lesson", "Урок программы не соответствует практике.", 422);
    }
  } else {
    // Если практика входит в программу, но урок не передан — не привязываем завершение к уроку.
    lessonId = null;
  }

  const result = completePractice({
    userId: auth.user.id,
    practiceId: practice.id,
    programLessonId: lessonId,
    durationSeconds: parsed.data.durationSeconds ?? practice.durationMinutes * 60,
    mood: parsed.data.mood ?? null,
  });

  if (result.created) {
    trackEvent("practice_completed", { userId: auth.user.id, props: { practiceId: practice.id } });
    if (lessonId) {
      trackEvent("program_lesson_completed", {
        userId: auth.user.id,
        props: { practiceId: practice.id, lessonId },
      });
    }
  }

  return ok({ id: result.id, created: result.created, practiceId: practice.id, programLessonId: lessonId });
}
