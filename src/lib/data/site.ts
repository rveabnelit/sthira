import { all } from "@/lib/db";

export function listReviews(limit = 6) {
  return all<{ id: string; author_name: string; author_note: string | null; text: string }>(
    "SELECT id, author_name, author_note, text FROM reviews WHERE status = 'published' ORDER BY created_at DESC LIMIT ?",
    limit,
  );
}

export function countStudents(): number {
  return Number(
    all<{ c: number }>("SELECT count(*) AS c FROM users WHERE role = 'student' AND deleted_at IS NULL")[0]?.c ?? 0,
  );
}

export function countCompletions(): number {
  return Number(all<{ c: number }>("SELECT count(*) AS c FROM practice_completions")[0]?.c ?? 0);
}
