import { all, one, run } from "@/lib/db";
import type { CoverTone } from "@/content/catalog";
import type { Completion } from "@/lib/types";

const MSK = "+3 hours";

type CompletionRow = {
  id: string;
  practice_id: string;
  practice_title: string;
  practice_slug: string;
  cover_tone: CoverTone;
  program_lesson_id: string | null;
  completed_at: string;
  duration_seconds: number | null;
  mood: string | null;
};

function mapCompletion(row: CompletionRow): Completion {
  return {
    id: row.id,
    practiceId: row.practice_id,
    practiceTitle: row.practice_title,
    practiceSlug: row.practice_slug,
    programLessonId: row.program_lesson_id,
    completedAt: row.completed_at,
    durationSeconds: row.duration_seconds,
    mood: row.mood,
    tone: row.cover_tone,
  };
}

export function listCompletions(userId: string, limit = 30, offset = 0): { items: Completion[]; total: number } {
  const rows = all<CompletionRow>(
    `SELECT c.id, c.practice_id, p.title AS practice_title, p.slug AS practice_slug, p.cover_tone,
            c.program_lesson_id, c.completed_at, c.duration_seconds, c.mood
       FROM practice_completions c
       JOIN practices p ON p.id = c.practice_id
      WHERE c.user_id = ?
      ORDER BY c.completed_at DESC
      LIMIT ? OFFSET ?`,
    userId,
    limit,
    offset,
  );
  const total = Number(
    one<{ c: number }>("SELECT count(*) AS c FROM practice_completions WHERE user_id = ?", userId)?.c ?? 0,
  );
  return { items: rows.map(mapCompletion), total };
}

export type DayActivity = { date: string; count: number };

export type ProgressStats = {
  totalCompletions: number;
  totalMinutes: number;
  activeDays: number;
  currentStreak: number;
  todayCount: number;
  weekCount: number;
  weekMinutes: number;
  prevWeekCount: number;
  calendar: DayActivity[];
  weeks: { start: string; label: string; count: number; minutes: number }[];
};

function dayKeys(userId: string): { date: string; count: number; seconds: number }[] {
  return all<{ date: string; count: number; seconds: number }>(
    `SELECT date(completed_at, ?) AS date, count(*) AS count, coalesce(sum(duration_seconds), 0) AS seconds
       FROM practice_completions
      WHERE user_id = ?
      GROUP BY date(completed_at, ?)
      ORDER BY date DESC`,
    MSK,
    userId,
    MSK,
  ).map((row) => ({ date: row.date, count: Number(row.count), seconds: Number(row.seconds) }));
}

function mskToday(): string {
  return new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function mskDateOffset(days: number): string {
  return new Date(Date.now() + 3 * 60 * 60 * 1000 + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function getProgressStats(userId: string): ProgressStats {
  const days = dayKeys(userId);
  const totalRow = one<{ c: number; seconds: number }>(
    "SELECT count(*) AS c, coalesce(sum(duration_seconds), 0) AS seconds FROM practice_completions WHERE user_id = ?",
    userId,
  );
  const dayCounts = new Map(days.map((day) => [day.date, day]));
  const today = mskToday();

  // Серия активных дней подряд (сегодня или вчера как начало).
  let currentStreak = 0;
  let cursor = dayCounts.has(today) ? 0 : -1;
  if (dayCounts.has(mskDateOffset(cursor))) {
    while (dayCounts.has(mskDateOffset(cursor))) {
      currentStreak += 1;
      cursor -= 1;
    }
  }

  const calendar: DayActivity[] = [];
  for (let i = 83; i >= 0; i--) {
    const date = mskDateOffset(-i);
    calendar.push({ date, count: dayCounts.get(date)?.count ?? 0 });
  }

  let weekCount = 0;
  let weekMinutes = 0;
  let prevWeekCount = 0;
  for (let i = 0; i < 7; i++) {
    const day = dayCounts.get(mskDateOffset(-i));
    weekCount += day?.count ?? 0;
    weekMinutes += Math.round((day?.seconds ?? 0) / 60);
  }
  for (let i = 7; i < 14; i++) {
    prevWeekCount += dayCounts.get(mskDateOffset(-i))?.count ?? 0;
  }

  const weeks: ProgressStats["weeks"] = [];
  for (let w = 7; w >= 0; w--) {
    let count = 0;
    let seconds = 0;
    for (let d = 0; d < 7; d++) {
      const day = dayCounts.get(mskDateOffset(-(w * 7 + d)));
      count += day?.count ?? 0;
      seconds += day?.seconds ?? 0;
    }
    const start = mskDateOffset(-(w * 7 + 6));
    weeks.push({
      start,
      label: new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(new Date(start)),
      count,
      minutes: Math.round(seconds / 60),
    });
  }

  return {
    totalCompletions: Number(totalRow?.c ?? 0),
    totalMinutes: Math.round(Number(totalRow?.seconds ?? 0) / 60),
    activeDays: days.length,
    currentStreak,
    todayCount: dayCounts.get(today)?.count ?? 0,
    weekCount,
    weekMinutes,
    prevWeekCount,
    calendar,
    weeks,
  };
}

export function getLastCompletion(userId: string): Completion | null {
  const row = one<CompletionRow>(
    `SELECT c.id, c.practice_id, p.title AS practice_title, p.slug AS practice_slug, p.cover_tone,
            c.program_lesson_id, c.completed_at, c.duration_seconds, c.mood
       FROM practice_completions c
       JOIN practices p ON p.id = c.practice_id
      WHERE c.user_id = ?
      ORDER BY c.completed_at DESC LIMIT 1`,
    userId,
  );
  return row ? mapCompletion(row) : null;
}

/** Сохраняет завершение практики. Повторное завершение того же урока не создаёт дубликат. */
export function completePractice(opts: {
  userId: string;
  practiceId: string;
  programLessonId?: string | null;
  durationSeconds?: number | null;
  mood?: string | null;
}): { created: boolean; id: string } {
  const existing = one<{ id: string }>(
    `SELECT id FROM practice_completions
      WHERE user_id = ? AND practice_id = ? AND ifnull(program_lesson_id, '') = ?`,
    opts.userId,
    opts.practiceId,
    opts.programLessonId ?? "",
  );
  if (existing) return { created: false, id: existing.id };
  const id = crypto.randomUUID();
  run(
    `INSERT INTO practice_completions (id, user_id, practice_id, program_lesson_id, completed_at, duration_seconds, mood, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    opts.userId,
    opts.practiceId,
    opts.programLessonId ?? null,
    new Date().toISOString(),
    opts.durationSeconds ?? null,
    opts.mood ?? null,
    new Date().toISOString(),
  );
  return { created: true, id };
}

export function programCompletionRate(userId: string): { completed: number; total: number } {
  const total = Number(
    one<{ c: number }>(
      `SELECT count(*) AS c FROM program_lessons l
        JOIN program_modules m ON m.id = l.module_id
        JOIN programs p ON p.id = m.program_id
       WHERE p.status = 'published'`,
    )?.c ?? 0,
  );
  const completed = Number(
    one<{ c: number }>(
      "SELECT count(DISTINCT program_lesson_id) AS c FROM practice_completions WHERE user_id = ? AND program_lesson_id IS NOT NULL",
      userId,
    )?.c ?? 0,
  );
  return { completed, total };
}

