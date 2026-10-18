import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { all, one, run } from "@/lib/db";
import type { SessionUser, UserRole } from "@/lib/types";

export const SESSION_COOKIE = "sthira_session";
const SESSION_TTL_DAYS = 30;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

type SessionRow = {
  session_id: string;
  expires_at: string;
  last_seen_at: string | null;
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  email_verified_at: string | null;
  created_at: string;
};

export type SessionRecord = {
  sessionId: string;
  expiresAt: string;
  user: SessionUser;
};

/** Читает сессию из cookie. Возвращает null, если сессии нет или она истекла. */
export async function readSession(): Promise<SessionRecord | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return readSessionByToken(token);
}

export function readSessionByToken(token: string): SessionRecord | null {
  const row = one<SessionRow>(
    `SELECT s.id AS session_id, s.expires_at, s.last_seen_at,
            u.id, u.email, u.display_name, u.role, u.email_verified_at, u.created_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND u.deleted_at IS NULL`,
    hashToken(token),
  );
  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    run("DELETE FROM sessions WHERE id = ?", row.session_id);
    return null;
  }
  return {
    sessionId: row.session_id,
    expiresAt: row.expires_at,
    user: {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      role: row.role,
      emailVerifiedAt: row.email_verified_at,
      createdAt: row.created_at,
    },
  };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await readSession();
  return session?.user ?? null;
}

export async function getCurrentSession(): Promise<SessionRecord | null> {
  return readSession();
}

export function createSession(userId: string, meta?: { userAgent?: string | null; ip?: string | null }) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const id = crypto.randomUUID();
  run(
    `INSERT INTO sessions (id, user_id, token_hash, user_agent, ip, created_at, expires_at, last_seen_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    userId,
    hashToken(token),
    meta?.userAgent ?? null,
    meta?.ip ?? null,
    new Date().toISOString(),
    expiresAt,
    new Date().toISOString(),
  );
  return { token, expiresAt, sessionId: id };
}

export function destroySessionByToken(token: string) {
  run("DELETE FROM sessions WHERE token_hash = ?", hashToken(token));
}

export function destroyUserSessions(userId: string, exceptSessionId?: string) {
  if (exceptSessionId) {
    run("DELETE FROM sessions WHERE user_id = ? AND id <> ?", userId, exceptSessionId);
  } else {
    run("DELETE FROM sessions WHERE user_id = ?", userId);
  }
}

export function sessionCookieOptions(expiresAt: string, options: { secure?: boolean } = {}) {
  // Secure включается по фактической схеме запроса: HTTPS в production и в туннеле,
  // HTTP на локальном стенде. Иначе браузер не сохранит cookie на http://localhost.
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: options.secure ?? false,
    path: "/",
    expires: new Date(expiresAt),
  };
}

/** Определяет HTTPS по прямому запросу или по заголовку reverse-proxy/туннеля. */
export function isSecureRequest(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0]!.trim() === "https";
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

/** Удаление просроченных записей — вызывается при входе и раз в сутки. */
export function cleanupExpiredSessions() {
  run("DELETE FROM sessions WHERE expires_at <= ?", new Date().toISOString());
}

export function listUserSessions(userId: string) {
  return all<{ id: string; user_agent: string | null; created_at: string; last_seen_at: string | null }>(
    "SELECT id, user_agent, created_at, last_seen_at FROM sessions WHERE user_id = ? AND expires_at > ? ORDER BY created_at DESC",
    userId,
    new Date().toISOString(),
  );
}
