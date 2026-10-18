import { all, one, run } from "@/lib/db";

export type WatchProgress = {
  practiceId: string;
  positionSeconds: number;
  durationSeconds: number;
  updatedAt: string;
};

export function getWatchProgress(userId: string, practiceId: string): WatchProgress | null {
  const row = one<{
    practice_id: string;
    position_seconds: number;
    duration_seconds: number;
    updated_at: string;
  }>("SELECT practice_id, position_seconds, duration_seconds, updated_at FROM practice_progress WHERE user_id = ? AND practice_id = ?", userId, practiceId);
  if (!row) return null;
  return {
    practiceId: row.practice_id,
    positionSeconds: Number(row.position_seconds),
    durationSeconds: Number(row.duration_seconds),
    updatedAt: row.updated_at,
  };
}

export function saveWatchProgress(input: {
  userId: string;
  practiceId: string;
  positionSeconds: number;
  durationSeconds: number;
}) {
  run(
    `INSERT INTO practice_progress (user_id, practice_id, position_seconds, duration_seconds, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, practice_id) DO UPDATE SET
       position_seconds = excluded.position_seconds,
       duration_seconds = excluded.duration_seconds,
       updated_at = excluded.updated_at`,
    input.userId,
    input.practiceId,
    Math.max(0, Math.round(input.positionSeconds)),
    Math.max(0, Math.round(input.durationSeconds)),
    new Date().toISOString(),
  );
}

export function clearWatchProgress(userId: string, practiceId: string) {
  run("DELETE FROM practice_progress WHERE user_id = ? AND practice_id = ?", userId, practiceId);
}

/** Незавершённая практика: есть прогресс, но нет завершения. */
export function lastUnfinishedPractice(userId: string) {
  const row = one<{
    practice_id: string;
    position_seconds: number;
    duration_seconds: number;
    updated_at: string;
    title: string;
    slug: string;
    duration_minutes: number;
    cover_tone: string;
  }>(
    `SELECT pr.practice_id, pr.position_seconds, pr.duration_seconds, pr.updated_at,
            p.title, p.slug, p.duration_minutes, p.cover_tone
       FROM practice_progress pr
       JOIN practices p ON p.id = pr.practice_id
      WHERE pr.user_id = ?
        AND pr.position_seconds > 20
        AND NOT EXISTS (
          SELECT 1 FROM practice_completions c
           WHERE c.user_id = pr.user_id AND c.practice_id = pr.practice_id
        )
      ORDER BY pr.updated_at DESC LIMIT 1`,
    userId,
  );
  if (!row) return null;
  return {
    practiceId: row.practice_id,
    title: row.title,
    slug: row.slug,
    durationMinutes: Number(row.duration_minutes),
    tone: row.cover_tone,
    positionSeconds: Number(row.position_seconds),
    durationSeconds: Number(row.duration_seconds),
    updatedAt: row.updated_at,
  };
}

export function recentlyViewed(userId: string, limit = 4) {
  return all<{ practice_id: string; updated_at: string; title: string; slug: string; cover_tone: string; duration_minutes: number }>(
    `SELECT pr.practice_id, pr.updated_at, p.title, p.slug, p.cover_tone, p.duration_minutes
       FROM practice_progress pr JOIN practices p ON p.id = pr.practice_id
      WHERE pr.user_id = ? ORDER BY pr.updated_at DESC LIMIT ?`,
    userId,
    limit,
  );
}
