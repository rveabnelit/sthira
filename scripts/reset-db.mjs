/**
 * Полный сброс локальной базы данных (SQLite).
 * Запуск: pnpm db:reset
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dbPath = process.env.DATABASE_PATH || path.join(root, "data", "sthira.db");

for (const suffix of ["", "-wal", "-shm"]) {
  const target = `${dbPath}${suffix}`;
  if (fs.existsSync(target)) {
    fs.rmSync(target);
    console.log(`[db:reset] удалён ${target}`);
  }
}

console.log("[db:reset] готово. Запустите приложение или pnpm seed, чтобы создать базу заново.");
