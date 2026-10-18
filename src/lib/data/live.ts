import { all, one, run } from "@/lib/db";
import type { LiveSession } from "@/lib/types";
import type { PlanCode } from "@/content/catalog";

type LiveRow = {
  id: string;
  title: string;
  description: string;
  teacher_name: string;
  starts_at: string;
  duration_minutes: number;
  capacity: number;
  join_url: string | null;
  cover_url: string | null;
  required_plan: PlanCode;
  status: "scheduled" | "canceled" | "completed";
  registered?: number;
  registration_count?: number;
};

function mapLive(row: LiveRow): LiveSession {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    teacherName: row.teacher_name,
    startsAt: row.starts_at,
    durationMinutes: Number(row.duration_minutes),
    capacity: Number(row.capacity),
    joinUrl: row.join_url,
    coverUrl: row.cover_url,
    requiredPlan: row.required_plan,
    status: row.status,
    registered: Number(row.registered ?? 0) === 1,
    registrationCount: Number(row.registration_count ?? 0),
  };
}

export function listUpcomingSessions(userId?: string | null): LiveSession[] {
  const rows = all<LiveRow>(
    `SELECT s.*,
            (SELECT count(*) FROM live_registrations r WHERE r.session_id = s.id) AS registration_count,
            CASE WHEN ? IS NULL THEN 0 ELSE EXISTS(
              SELECT 1 FROM live_registrations r2 WHERE r2.session_id = s.id AND r2.user_id = ?
            ) END AS registered
       FROM live_sessions s
      WHERE s.status = 'scheduled' AND s.starts_at > ?
      ORDER BY s.starts_at ASC`,
    userId ?? null,
    userId ?? null,
    new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  );
  return rows.map(mapLive);
}

export function listSessionsForAdmin(): LiveSession[] {
  const rows = all<LiveRow>(
    `SELECT s.*,
            (SELECT count(*) FROM live_registrations r WHERE r.session_id = s.id) AS registration_count,
            0 AS registered
       FROM live_sessions s
      ORDER BY s.starts_at DESC`,
  );
  return rows.map(mapLive);
}

export function getSession(id: string, userId?: string | null): LiveSession | null {
  const row = one<LiveRow>(
    `SELECT s.*,
            (SELECT count(*) FROM live_registrations r WHERE r.session_id = s.id) AS registration_count,
            CASE WHEN ? IS NULL THEN 0 ELSE EXISTS(
              SELECT 1 FROM live_registrations r2 WHERE r2.session_id = s.id AND r2.user_id = ?
            ) END AS registered
       FROM live_sessions s WHERE s.id = ?`,
    userId ?? null,
    userId ?? null,
    id,
  );
  return row ? mapLive(row) : null;
}

export function registerForSession(userId: string, sessionId: string) {
  const session = getSession(sessionId);
  if (!session) return { ok: false as const, reason: "not_found" as const };
  if (session.status !== "scheduled") return { ok: false as const, reason: "canceled" as const };
  const count = all<{ c: number }>("SELECT count(*) AS c FROM live_registrations WHERE session_id = ?", sessionId)[0];
  if (Number(count?.c ?? 0) >= session.capacity && !session.registered) {
    return { ok: false as const, reason: "full" as const };
  }
  run(
    "INSERT OR IGNORE INTO live_registrations (user_id, session_id, created_at) VALUES (?, ?, ?)",
    userId,
    sessionId,
    new Date().toISOString(),
  );
  return { ok: true as const };
}

export function unregisterFromSession(userId: string, sessionId: string) {
  run("DELETE FROM live_registrations WHERE user_id = ? AND session_id = ?", userId, sessionId);
}

export function listRegistrations(sessionId: string) {
  return all<{ user_id: string; email: string; display_name: string; created_at: string }>(
    `SELECT r.user_id, u.email, u.display_name, r.created_at
       FROM live_registrations r JOIN users u ON u.id = r.user_id
      WHERE r.session_id = ? ORDER BY r.created_at ASC`,
    sessionId,
  );
}

export function countUpcomingSessions(): number {
  return Number(
    one<{ c: number }>(
      "SELECT count(*) AS c FROM live_sessions WHERE status = 'scheduled' AND starts_at > ?",
      new Date().toISOString(),
    )?.c ?? 0,
  );
}
