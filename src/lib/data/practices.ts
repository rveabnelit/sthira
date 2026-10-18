import { all, one } from "@/lib/db";
import type { CoverTone, Difficulty, Goal, PlanCode } from "@/content/catalog";
import type { Practice } from "@/lib/types";

export type PracticeRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  teacher_note: string | null;
  thumbnail_url: string | null;
  cover_tone: CoverTone;
  video_provider: string;
  video_asset_id: string | null;
  video_url: string | null;
  duration_minutes: number;
  difficulty: Difficulty;
  goal: Goal;
  tags: string;
  required_plan: PlanCode;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
};

export function parseTags(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((tag): tag is string => typeof tag === "string") : [];
  } catch {
    return [];
  }
}

export function mapPractice(row: PracticeRow): Practice {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    teacherNote: row.teacher_note,
    thumbnailUrl: row.thumbnail_url,
    coverTone: row.cover_tone,
    videoProvider: row.video_provider,
    videoAssetId: row.video_asset_id,
    videoUrl: row.video_url,
    durationMinutes: row.duration_minutes,
    difficulty: row.difficulty,
    goal: row.goal,
    tags: parseTags(row.tags),
    requiredPlan: row.required_plan,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type PracticeListItem = Practice & {
  isFavorite: boolean;
  isCompleted: boolean;
  completions: number;
};

export type PracticeSort = "recommended" | "newest" | "popular" | "shortest";

export type PracticeQuery = {
  q?: string;
  goal?: string;
  difficulty?: string;
  duration?: string;
  tag?: string;
  status?: string[];
  sort?: PracticeSort;
  limit?: number;
  offset?: number;
  userId?: string | null;
  includeArchived?: boolean;
};

const DURATION_RANGES: Record<string, [number, number]> = {
  short: [0, 14],
  medium: [15, 30],
  long: [31, 45],
  deep: [46, 600],
};

function buildWhere(query: PracticeQuery, params: unknown[]) {
  const clauses: string[] = [];
  const statuses = query.status ?? (query.includeArchived ? undefined : ["published"]);
  if (statuses && statuses.length) {
    clauses.push(`p.status IN (${statuses.map(() => "?").join(", ")})`);
    params.push(...statuses);
  }
  if (query.q) {
    const like = `%${query.q.trim().toLowerCase()}%`;
    clauses.push("(lower(p.title) LIKE ? OR lower(p.description) LIKE ? OR lower(p.tags) LIKE ?)");
    params.push(like, like, like);
  }
  if (query.goal) {
    clauses.push("p.goal = ?");
    params.push(query.goal);
  }
  if (query.difficulty) {
    clauses.push("p.difficulty = ?");
    params.push(query.difficulty);
  }
  if (query.duration && DURATION_RANGES[query.duration]) {
    const [min, max] = DURATION_RANGES[query.duration];
    clauses.push("p.duration_minutes BETWEEN ? AND ?");
    params.push(min, max);
  }
  if (query.tag) {
    clauses.push("p.tags LIKE ?");
    params.push(`%${query.tag}%`);
  }
  return clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
}

function orderBy(sort: PracticeSort | undefined) {
  switch (sort) {
    case "newest":
      return "p.created_at DESC, p.title ASC";
    case "popular":
      return "completions DESC, p.created_at DESC";
    case "shortest":
      return "p.duration_minutes ASC, p.title ASC";
    default:
      return "p.created_at ASC, p.title ASC";
  }
}

export function listPractices(query: PracticeQuery = {}): { items: PracticeListItem[]; total: number } {
  const params: unknown[] = [];
  const where = buildWhere(query, params);
  const limit = Math.min(Math.max(query.limit ?? 24, 1), 100);
  const offset = Math.max(query.offset ?? 0, 0);
  const userId = query.userId ?? null;

  const totalRow = one<{ c: number }>(`SELECT count(*) AS c FROM practices p ${where}`, ...params);
  const rows = all<PracticeRow & { is_favorite: number; is_completed: number; completions: number }>(
    `SELECT p.*,
            CASE WHEN ? IS NULL THEN 0 ELSE EXISTS(
              SELECT 1 FROM favorites f WHERE f.practice_id = p.id AND f.user_id = ?
            ) END AS is_favorite,
            CASE WHEN ? IS NULL THEN 0 ELSE EXISTS(
              SELECT 1 FROM practice_completions c WHERE c.practice_id = p.id AND c.user_id = ?
            ) END AS is_completed,
            (SELECT count(*) FROM practice_completions c2 WHERE c2.practice_id = p.id) AS completions
       FROM practices p
       ${where}
       ORDER BY ${orderBy(query.sort)}
       LIMIT ? OFFSET ?`,
    userId,
    userId,
    userId,
    userId,
    ...params,
    limit,
    offset,
  );

  return {
    items: rows.map((row) => ({
      ...mapPractice(row),
      isFavorite: Number(row.is_favorite) === 1,
      isCompleted: Number(row.is_completed) === 1,
      completions: Number(row.completions),
    })),
    total: Number(totalRow?.c ?? 0),
  };
}

export function getPracticeBySlug(slug: string, userId?: string | null): PracticeListItem | null {
  const row = one<PracticeRow & { is_favorite: number; is_completed: number; completions: number }>(
    `SELECT p.*,
            CASE WHEN ? IS NULL THEN 0 ELSE EXISTS(SELECT 1 FROM favorites f WHERE f.practice_id = p.id AND f.user_id = ?) END AS is_favorite,
            CASE WHEN ? IS NULL THEN 0 ELSE EXISTS(SELECT 1 FROM practice_completions c WHERE c.practice_id = p.id AND c.user_id = ?) END AS is_completed,
            (SELECT count(*) FROM practice_completions c2 WHERE c2.practice_id = p.id) AS completions
       FROM practices p WHERE p.slug = ?`,
    userId ?? null,
    userId ?? null,
    userId ?? null,
    userId ?? null,
    slug,
  );
  if (!row) return null;
  return {
    ...mapPractice(row),
    isFavorite: Number(row.is_favorite) === 1,
    isCompleted: Number(row.is_completed) === 1,
    completions: Number(row.completions),
  };
}

export function getPracticeById(id: string, userId?: string | null): PracticeListItem | null {
  const row = one<PracticeRow & { is_favorite: number; is_completed: number; completions: number }>(
    `SELECT p.*,
            CASE WHEN ? IS NULL THEN 0 ELSE EXISTS(SELECT 1 FROM favorites f WHERE f.practice_id = p.id AND f.user_id = ?) END AS is_favorite,
            CASE WHEN ? IS NULL THEN 0 ELSE EXISTS(SELECT 1 FROM practice_completions c WHERE c.practice_id = p.id AND c.user_id = ?) END AS is_completed,
            (SELECT count(*) FROM practice_completions c2 WHERE c2.practice_id = p.id) AS completions
       FROM practices p WHERE p.id = ?`,
    userId ?? null,
    userId ?? null,
    userId ?? null,
    userId ?? null,
    id,
  );
  if (!row) return null;
  return {
    ...mapPractice(row),
    isFavorite: Number(row.is_favorite) === 1,
    isCompleted: Number(row.is_completed) === 1,
    completions: Number(row.completions),
  };
}

export function getPracticeTags(): { tag: string; count: number }[] {
  const rows = all<{ tags: string }>("SELECT tags FROM practices WHERE status = 'published'");
  const counter = new Map<string, number>();
  rows.forEach((row) => {
    parseTags(row.tags).forEach((tag) => counter.set(tag, (counter.get(tag) ?? 0) + 1));
  });
  return [...counter.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "ru"))
    .slice(0, 14);
}

export function relatedPractices(practice: Practice, limit = 3): Practice[] {
  const rows = all<PracticeRow>(
    `SELECT * FROM practices
      WHERE status = 'published' AND id <> ?
      ORDER BY (CASE WHEN goal = ? THEN 0 ELSE 1 END),
               abs(duration_minutes - ?),
               created_at ASC
      LIMIT ?`,
    practice.id,
    practice.goal,
    practice.durationMinutes,
    limit,
  );
  return rows.map(mapPractice);
}

export function practiceCountsByGoal(): Record<string, number> {
  const rows = all<{ goal: string; c: number }>(
    "SELECT goal, count(*) AS c FROM practices WHERE status = 'published' GROUP BY goal",
  );
  return Object.fromEntries(rows.map((row) => [row.goal, Number(row.c)]));
}

export function countPublishedPractices(): number {
  return Number(one<{ c: number }>("SELECT count(*) AS c FROM practices WHERE status = 'published'")?.c ?? 0);
}

export function listProgramsForPractice(practiceId: string) {
  return all<{ id: string; slug: string; title: string }>(
    `SELECT DISTINCT pr.id, pr.slug, pr.title
       FROM programs pr
       JOIN program_modules m ON m.program_id = pr.id
       JOIN program_lessons l ON l.module_id = m.id
      WHERE l.practice_id = ? AND pr.status = 'published'`,
    practiceId,
  );
}
