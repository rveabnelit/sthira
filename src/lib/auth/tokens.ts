import { randomBytes } from "node:crypto";
import { one, run } from "@/lib/db";
import { hashToken } from "@/lib/auth/session";

export type TokenKind = "email_verify" | "password_reset";

export function createAuthToken(userId: string, kind: TokenKind, ttlMinutes: number): string {
  const raw = randomBytes(32).toString("base64url");
  run(
    `INSERT INTO auth_tokens (id, user_id, kind, token_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    crypto.randomUUID(),
    userId,
    kind,
    hashToken(raw),
    new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString(),
    new Date().toISOString(),
  );
  return raw;
}

/** Одноразовое использование: повторный вызов с тем же токеном не сработает. */
export function consumeAuthToken(rawToken: string, kind: TokenKind): { userId: string } | null {
  const row = one<{ id: string; user_id: string; expires_at: string; used_at: string | null }>(
    "SELECT id, user_id, expires_at, used_at FROM auth_tokens WHERE token_hash = ? AND kind = ?",
    hashToken(rawToken),
    kind,
  );
  if (!row) return null;
  if (row.used_at) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) return null;
  const result = run(
    "UPDATE auth_tokens SET used_at = ? WHERE id = ? AND used_at IS NULL",
    new Date().toISOString(),
    row.id,
  );
  if (Number(result.changes) !== 1) return null;
  return { userId: row.user_id };
}
