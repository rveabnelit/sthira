/**
 * Смена пароля любого аккаунта (например, администратора перед публичной демонстрацией).
 *
 *   node scripts/set-admin-password.mjs admin@sthira.school "НовыйПароль123"
 *
 * Работает напрямую с SQLite и использует тот же формат scrypt-хеша, что и приложение.
 */
import { randomBytes, scryptSync } from "node:crypto";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const [, , emailArg, passwordArg] = process.argv;
const email = (emailArg || "").trim().toLowerCase();
const password = passwordArg || "";

if (!email || !password) {
  console.error('Использование: node scripts/set-admin-password.mjs <email> "<пароль>"');
  process.exit(1);
}
if (password.length < 8 || !/[a-zA-Zа-яА-Я]/.test(password) || !/\d/.test(password)) {
  console.error("Пароль должен быть не короче 8 символов и содержать буквы и цифры.");
  process.exit(1);
}

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "sthira.db");
const db = new DatabaseSync(dbPath);
const row = db.prepare("SELECT id, role FROM users WHERE email = ?").get(email);
if (!row) {
  console.error(`Аккаунт ${email} не найден в ${dbPath}`);
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password.normalize("NFKC"), salt, 64, { N: 16384, r: 8, p: 1 });
const stored = ["scrypt", 16384, 8, 1, salt.toString("base64url"), hash.toString("base64url")].join("$");

db.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?").run(
  stored,
  new Date().toISOString(),
  row.id,
);
db.prepare("DELETE FROM sessions WHERE user_id = ?").run(row.id);

console.log(`Пароль обновлён для ${email} (роль: ${row.role}). Все сессии этого аккаунта завершены.`);
