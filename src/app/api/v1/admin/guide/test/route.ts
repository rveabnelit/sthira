import { z } from "zod";
import { ok, parseBody, requireApiAdmin } from "@/lib/api";
import { generateGuideAnswer } from "@/lib/guide";

const schema = z.object({ question: z.string().trim().min(3, "Введите вопрос.").max(1000) });

/** Проверка ответов Guide без сохранения в историю и без лимитов. */
export async function POST(request: Request) {
  const auth = await requireApiAdmin();
  if ("response" in auth) return auth.response;
  const parsed = await parseBody(request, schema);
  if (!parsed.success) return parsed.response;

  const answer = generateGuideAnswer({
    message: parsed.data.question,
    userId: null,
    subscription: null,
  });

  return ok({
    answer: answer.content,
    citations: answer.citations,
    practices: answer.practices.map((practice) => ({ id: practice.id, title: practice.title })),
    safety: answer.safety,
    provider: answer.provider,
  });
}
