import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { seedDatabase } from "./seed";

/**
 * Единая точка доступа к SQLite.
 * В production тот же файл схемы применяется при старте (идемпотентно).
 */
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "sthira.db");
const SCHEMA_PATH = path.join(process.cwd(), "src", "lib", "db", "schema.sql");

type GlobalDb = { __sthiraDb?: DatabaseSync; __sthiraSeeded?: boolean };
const globalRef = globalThis as unknown as GlobalDb;

function createConnection(): DatabaseSync {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const database = new DatabaseSync(DB_PATH);
  database.exec("PRAGMA journal_mode = WAL;");
  database.exec("PRAGMA foreign_keys = ON;");
  database.exec("PRAGMA busy_timeout = 5000;");
  const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
  database.exec(schema);
  const applied = database.prepare("SELECT name FROM migrations WHERE name = ?").get("schema-v1");
  if (!applied) {
    database
      .prepare("INSERT INTO migrations (name, applied_at) VALUES (?, ?)")
      .run("schema-v1", new Date().toISOString());
  }
  return database;
}

export function getDb(): DatabaseSync {
  if (!globalRef.__sthiraDb) {
    globalRef.__sthiraDb = createConnection();
    if (!globalRef.__sthiraSeeded) {
      globalRef.__sthiraSeeded = true;
      // Наполнение выполняется один раз для пустой базы.
      const row = globalRef.__sthiraDb.prepare("SELECT count(*) AS c FROM users").get() as { c: number };
      if (!row || Number(row.c) === 0) {
        seedDatabase(globalRef.__sthiraDb);
      }
    }
  }
  return globalRef.__sthiraDb;
}

export function all<T>(sql: string, ...params: unknown[]): T[] {
  return getDb().prepare(sql).all(...(params as never[])) as T[];
}

export function one<T>(sql: string, ...params: unknown[]): T | undefined {
  return getDb().prepare(sql).get(...(params as never[])) as T | undefined;
}

export function run(sql: string, ...params: unknown[]) {
  return getDb().prepare(sql).run(...(params as never[]));
}

export function exec(sql: string) {
  getDb().exec(sql);
}

export function transaction<T>(fn: () => T): T {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function randomId(prefix = ""): string {
  const id = crypto.randomUUID();
  return prefix ? `${prefix}_${id}` : id;
}

export function nowIso(): string {
  return new Date().toISOString();
}
