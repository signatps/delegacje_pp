import type { Database, SqlJsStatic } from "sql.js";
import { SCHEMA_SQL } from "./schema.sql";
import { seedIfEmpty } from "./seed";

const STORAGE_KEY = "delegacje_pp_sqlite_v1";

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

async function loadSqlJs(): Promise<SqlJsStatic> {
  if (SQL) return SQL;
  // Vite may resolve sql.js without a default ESM export — handle both shapes.
  const mod = (await import("sql.js")) as { default?: (cfg?: object) => Promise<SqlJsStatic> } & ((
    cfg?: object,
  ) => Promise<SqlJsStatic>);
  const init = typeof mod === "function" ? mod : mod.default;
  if (!init) {
    throw new Error("Nie udało się załadować sql.js");
  }
  SQL = await init({
    locateFile: (file: string) => `/${file}`,
  });
  return SQL;
}

function persistSoon() {
  if (typeof window === "undefined" || !db) return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    try {
      const data = db!.export();
      const binary = Array.from(data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(binary));
    } catch (e) {
      console.error("Nie udało się zapisać bazy lokalnej", e);
    }
  }, 200);
}

export function persistNow() {
  if (typeof window === "undefined" || !db) return;
  const data = db.export();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(data)));
}

export async function getDb(): Promise<Database> {
  if (db) return db;
  const sql = await loadSqlJs();
  const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  if (raw) {
    const bytes = new Uint8Array(JSON.parse(raw) as number[]);
    db = new sql.Database(bytes);
  } else {
    db = new sql.Database();
    db.run(SCHEMA_SQL);
    db.run(`INSERT OR REPLACE INTO meta(key, value) VALUES ('schema_version', '1')`);
    seedIfEmpty(db);
    persistNow();
  }
  return db;
}

export function run(dbRef: Database, sql: string, params: unknown[] = []) {
  dbRef.run(sql, params as never[]);
  persistSoon();
}

export function all<T extends Record<string, unknown>>(
  dbRef: Database,
  sql: string,
  params: unknown[] = [],
): T[] {
  const stmt = dbRef.prepare(sql);
  stmt.bind(params as never[]);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

export function get<T extends Record<string, unknown>>(
  dbRef: Database,
  sql: string,
  params: unknown[] = [],
): T | null {
  const rows = all<T>(dbRef, sql, params);
  return rows[0] ?? null;
}

export async function resetDatabase() {
  const sql = await loadSqlJs();
  db = new sql.Database();
  db.run(SCHEMA_SQL);
  db.run(`INSERT OR REPLACE INTO meta(key, value) VALUES ('schema_version', '1')`);
  seedIfEmpty(db);
  persistNow();
  return db;
}

export async function exportDatabaseBackup(): Promise<Blob> {
  const database = await getDb();
  persistNow();
  const data = database.export();
  return new Blob([data.buffer as ArrayBuffer], { type: "application/x-sqlite3" });
}

export async function importDatabaseBackup(file: ArrayBuffer) {
  const sql = await loadSqlJs();
  db = new sql.Database(new Uint8Array(file));
  persistNow();
  return db;
}
