/**
 * Наполнение базы демонстрационными данными.
 * Запуск: pnpm seed (или node node_modules/tsx/dist/cli.mjs scripts/seed.ts)
 */
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { seedDatabase } from "../src/lib/db/seed.ts";

const root = process.cwd();
const dbPath = process.env.DATABASE_PATH || path.join(root, "data", "sthira.db");
const schemaPath = path.join(root, "src", "lib", "db", "schema.sql");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");
db.exec(fs.readFileSync(schemaPath, "utf8"));
db.exec(`CREATE TABLE IF NOT EXISTS migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, applied_at TEXT NOT NULL)`);

const existing = db.prepare("SELECT count(*) AS c FROM users").get() as { c: number } | undefined;
if (Number(existing?.c ?? 0) > 0 && process.env.FORCE_SEED !== "true") {
  console.log(`[seed] база уже содержит ${existing?.c} пользователей. Пропущено. FORCE_SEED=true — пересоздать данные.`);
  process.exit(0);
}

if (process.env.FORCE_SEED === "true") {
  const tables = [
    "webhook_events", "payments", "checkout_orders", "subscriptions", "practice_completions", "practice_progress",
    "favorites", "program_lessons", "program_modules", "programs", "practices", "plans", "guide_messages",
    "guide_conversations", "guide_documents", "guide_usage", "live_registrations", "live_sessions",
    "notifications", "contact_messages", "reviews", "analytics_events", "audit_log", "site_content",
    "user_preferences", "sessions", "auth_tokens", "users",
  ];
  for (const table of tables) db.exec(`DELETE FROM ${table}`);
  console.log("[seed] существующие данные очищены.");
}

seedDatabase(db);
const counts = db.prepare("SELECT (SELECT count(*) FROM practices) AS practices, (SELECT count(*) FROM programs) AS programs, (SELECT count(*) FROM users) AS users").get() as
  | { practices: number; programs: number; users: number }
  | undefined;
console.log(`[seed] готово: ${counts?.practices ?? 0} практик, ${counts?.programs ?? 0} программ, ${counts?.users ?? 0} аккаунтов.`);
console.log("[seed] демо-доступ: admin@sthira.school / Admin12345!, student@sthira.school / Student12345!");
