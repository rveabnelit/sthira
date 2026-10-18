import { run } from "@/lib/db";

export type AuditInput = {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  meta?: Record<string, unknown>;
  result?: "success" | "failure";
};

/** Журнал критичных действий. Секреты и платёжные данные сюда не попадают. */
export function logAudit(input: AuditInput) {
  try {
    run(
      `INSERT INTO audit_log (id, actor_id, actor_email, action, entity_type, entity_id, meta, result, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      crypto.randomUUID(),
      input.actorId ?? null,
      input.actorEmail ?? null,
      input.action,
      input.entityType,
      input.entityId ?? null,
      JSON.stringify(input.meta ?? {}),
      input.result ?? "success",
      new Date().toISOString(),
    );
  } catch (error) {
    console.error("[audit] не удалось записать действие", input.action, error);
  }
}
