import { addFavorite, removeFavorite } from "@/lib/data/favorites";
import { fail, ok, requireApiUser } from "@/lib/api";
import { getPracticeById } from "@/lib/data/practices";

export async function POST(_request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { practiceId } = await params;
  if (!getPracticeById(practiceId)) return fail("not_found", "Практика не найдена.", 404);
  const result = addFavorite(auth.user.id, practiceId);
  return ok(result, 201);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { practiceId } = await params;
  return ok(removeFavorite(auth.user.id, practiceId));
}
