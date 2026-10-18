import { all, run } from "@/lib/db";
import { listPractices, getPracticeById, type PracticeListItem } from "@/lib/data/practices";

export function listFavoritePractices(userId: string): PracticeListItem[] {
  const rows = all<{ practice_id: string }>(
    "SELECT practice_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC",
    userId,
  );
  const items = rows
    .map((row) => getPracticeById(row.practice_id, userId))
    .filter((item): item is PracticeListItem => Boolean(item));
  return items;
}

export function isFavorite(userId: string, practiceId: string): boolean {
  const row = all<{ practice_id: string }>(
    "SELECT practice_id FROM favorites WHERE user_id = ? AND practice_id = ?",
    userId,
    practiceId,
  );
  return row.length > 0;
}

export function addFavorite(userId: string, practiceId: string): { favorite: boolean } {
  const practice = getPracticeById(practiceId);
  if (!practice) throw new Error("practice_not_found");
  run(
    "INSERT OR IGNORE INTO favorites (user_id, practice_id, created_at) VALUES (?, ?, ?)",
    userId,
    practiceId,
    new Date().toISOString(),
  );
  return { favorite: true };
}

export function removeFavorite(userId: string, practiceId: string): { favorite: boolean } {
  run("DELETE FROM favorites WHERE user_id = ? AND practice_id = ?", userId, practiceId);
  return { favorite: false };
}

export function countFavorites(userId: string): number {
  const row = all<{ c: number }>("SELECT count(*) AS c FROM favorites WHERE user_id = ?", userId)[0];
  return Number(row?.c ?? 0);
}

export function popularFavorites(limit = 3) {
  return listPractices({ sort: "popular", limit }).items;
}
