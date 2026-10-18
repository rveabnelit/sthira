import { all, one } from "@/lib/db";
import type { CoverTone, Difficulty, PlanCode } from "@/content/catalog";
import type { LessonProgress, Program, ProgramModule, ProgramProgress } from "@/lib/types";

type ProgramRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  description: string;
  thumbnail_url: string | null;
  cover_tone: CoverTone;
  difficulty: Difficulty;
  estimated_duration: string;
  lessons_per_week: number;
  audience: string | null;
  outcomes: string;
  required_plan: PlanCode;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
  lessons_count?: number;
};

export function parseList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function mapProgram(row: ProgramRow): Program {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    description: row.description,
    thumbnailUrl: row.thumbnail_url,
    coverTone: row.cover_tone,
    difficulty: row.difficulty,
    estimatedDuration: row.estimated_duration,
    lessonsPerWeek: row.lessons_per_week,
    audience: row.audience,
    outcomes: parseList(row.outcomes),
    requiredPlan: row.required_plan,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lessonsCount: row.lessons_count !== undefined ? Number(row.lessons_count) : undefined,
  };
}

const LESSONS_COUNT_SQL = `(SELECT count(*) FROM program_modules m JOIN program_lessons l ON l.module_id = m.id WHERE m.program_id = p.id) AS lessons_count`;

export function listPrograms(opts: { status?: string[]; limit?: number; offset?: number; difficulty?: string } = {}) {
  const statuses = opts.status ?? ["published"];
  const params: unknown[] = [...statuses];
  let filter = `WHERE p.status IN (${statuses.map(() => "?").join(", ")})`;
  if (opts.difficulty) {
    filter += " AND p.difficulty = ?";
    params.push(opts.difficulty);
  }
  const rows = all<ProgramRow>(
    `SELECT p.*, ${LESSONS_COUNT_SQL} FROM programs p ${filter} ORDER BY p.created_at ASC LIMIT ? OFFSET ?`,
    ...params,
    opts.limit ?? 24,
    opts.offset ?? 0,
  );
  return rows.map(mapProgram);
}

export function getProgramBySlug(slug: string): Program | null {
  const row = one<ProgramRow>(`SELECT p.*, ${LESSONS_COUNT_SQL} FROM programs p WHERE p.slug = ?`, slug);
  return row ? mapProgram(row) : null;
}

export function getProgramById(id: string): Program | null {
  const row = one<ProgramRow>(`SELECT p.*, ${LESSONS_COUNT_SQL} FROM programs p WHERE p.id = ?`, id);
  return row ? mapProgram(row) : null;
}

type LessonRow = {
  id: string;
  module_id: string;
  module_title: string;
  module_description: string | null;
  module_position: number;
  practice_id: string;
  practice_slug: string;
  practice_duration: number;
  practice_difficulty: Difficulty;
  practice_status: string;
  title: string;
  description: string | null;
  position: number;
};

export function getProgramModules(programId: string): ProgramModule[] {
  const rows = all<LessonRow>(
    `SELECT l.id, l.module_id, m.title AS module_title, m.description AS module_description, m.position AS module_position,
            l.practice_id, pr.slug AS practice_slug, pr.duration_minutes AS practice_duration,
            pr.difficulty AS practice_difficulty, pr.status AS practice_status,
            l.title, l.description, l.position
       FROM program_modules m
       JOIN program_lessons l ON l.module_id = m.id
       JOIN practices pr ON pr.id = l.practice_id
      WHERE m.program_id = ?
      ORDER BY m.position ASC, l.position ASC`,
    programId,
  );

  const modules = new Map<string, ProgramModule>();
  rows.forEach((row) => {
    if (!modules.has(row.module_id)) {
      modules.set(row.module_id, {
        id: row.module_id,
        title: row.module_title,
        description: row.module_description,
        position: Number(row.module_position),
        lessons: [],
      });
    }
    modules.get(row.module_id)!.lessons.push({
      id: row.id,
      moduleId: row.module_id,
      moduleTitle: row.module_title,
      modulePosition: Number(row.module_position),
      practiceId: row.practice_id,
      practiceSlug: row.practice_slug,
      practiceDuration: Number(row.practice_duration),
      practiceDifficulty: row.practice_difficulty,
      title: row.title,
      description: row.description,
      position: Number(row.position),
    });
  });

  return [...modules.values()].sort((a, b) => a.position - b.position);
}

export function getCompletedLessonIds(userId: string, programLessonIds: string[]): Set<string> {
  if (!programLessonIds.length) return new Set();
  const rows = all<{ program_lesson_id: string; completed_at: string }>(
    `SELECT program_lesson_id, completed_at FROM practice_completions
      WHERE user_id = ? AND program_lesson_id IN (${programLessonIds.map(() => "?").join(", ")})`,
    userId,
    ...programLessonIds,
  );
  return new Set(rows.map((row) => row.program_lesson_id));
}

export function buildProgramProgress(
  program: Program,
  modules: ProgramModule[],
  userId: string | null,
  canAccess: boolean,
): ProgramProgress {
  const allLessonIds = modules.flatMap((m) => m.lessons.map((l) => l.id));
  const completedRows = userId && allLessonIds.length
    ? all<{ program_lesson_id: string; completed_at: string }>(
        `SELECT program_lesson_id, completed_at FROM practice_completions
          WHERE user_id = ? AND program_lesson_id IN (${allLessonIds.map(() => "?").join(", ")})`,
        userId,
        ...allLessonIds,
      )
    : [];
  const completedAtByLesson = new Map(completedRows.map((row) => [row.program_lesson_id, row.completed_at]));
  const completedIds = new Set(completedRows.map((row) => row.program_lesson_id));

  const flat = modules.flatMap((m) => m.lessons);
  let currentFound = false;
  const progressModules = modules.map((module) => {
    const lessons: LessonProgress[] = module.lessons.map((lesson) => {
      const completed = completedIds.has(lesson.id);
      const locked = !canAccess;
      let state: LessonProgress["state"] = "upcoming";
      if (locked) state = "locked";
      else if (completed) state = "completed";
      else if (!currentFound) {
        state = "current";
        currentFound = true;
      }
      return {
        ...lesson,
        completed,
        completedAt: completedAtByLesson.get(lesson.id) ?? null,
        locked,
        state,
      };
    });
    return {
      ...module,
      lessons,
      completedCount: lessons.filter((l) => l.completed).length,
    };
  });

  const completedCount = flat.filter((lesson) => completedIds.has(lesson.id)).length;
  const totalCount = flat.length;
  const percent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  const flatProgress = progressModules.flatMap((m) => m.lessons);
  const currentLesson = flatProgress.find((l) => l.state === "current") ?? null;
  const nextLesson = currentLesson
    ? flatProgress[flatProgress.indexOf(currentLesson) + 1] ?? null
    : flatProgress.find((l) => !l.completed && l.state !== "locked") ?? null;

  return {
    program,
    modules: progressModules,
    completedCount,
    totalCount,
    percent,
    currentLesson,
    nextLesson,
  };
}

export function getProgramProgress(programId: string, userId: string | null, canAccess: boolean): ProgramProgress | null {
  const program = getProgramById(programId);
  if (!program) return null;
  return buildProgramProgress(program, getProgramModules(programId), userId, canAccess);
}

/** Прогресс по всем опубликованным программам для личного кабинета. */
export function listUserPrograms(userId: string, canAccess: boolean) {
  const programs = listPrograms({ limit: 50 });
  return programs.map((program) => {
    const modules = getProgramModules(program.id);
    const progress = buildProgramProgress(program, modules, userId, canAccess);
    return {
      program,
      percent: progress.percent,
      completedCount: progress.completedCount,
      totalCount: progress.totalCount,
      currentLesson: progress.currentLesson,
      started: progress.completedCount > 0,
      completed: progress.totalCount > 0 && progress.completedCount === progress.totalCount,
    };
  });
}

export function countPublishedPrograms(): number {
  return Number(one<{ c: number }>("SELECT count(*) AS c FROM programs WHERE status = 'published'")?.c ?? 0);
}

export function programLessonById(lessonId: string) {
  return one<LessonRow>(
    `SELECT l.id, l.module_id, m.title AS module_title, m.description AS module_description, m.position AS module_position,
            l.practice_id, pr.slug AS practice_slug, pr.duration_minutes AS practice_duration,
            pr.difficulty AS practice_difficulty, pr.status AS practice_status,
            l.title, l.description, l.position
       FROM program_lessons l
       JOIN program_modules m ON m.id = l.module_id
       JOIN practices pr ON pr.id = l.practice_id
      WHERE l.id = ?`,
    lessonId,
  );
}
