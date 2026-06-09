import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import type { Database, Sqlite3Static } from "@sqlite.org/sqlite-wasm";

let sqlite3: Sqlite3Static | null = null;
let db: Database | null = null;

async function init(): Promise<void> {
  if (sqlite3) return;
  sqlite3 = await sqlite3InitModule();
}

function getDb(): Database {
  if (!db) throw new Error("DB not open");
  return db;
}

function runMigrations(database: Database): void {
  database.exec("PRAGMA journal_mode=WAL");
  database.exec("PRAGMA foreign_keys=ON");

  database.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT DEFAULT (datetime('now'))
    )
  `);

  const applied = new Set<string>(
    database.selectValues("SELECT name FROM _migrations").map((r) => String(r))
  );

  const migrations: [string, string][] = [
    [
      "001_initial",
      `CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        is_recurring INTEGER DEFAULT 0,
        weekdays TEXT DEFAULT '[0,1,2,3,4,5,6]',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        deleted_at TEXT DEFAULT NULL
      );
      CREATE TABLE IF NOT EXISTS task_completions (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        completion_date TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('completed', 'skipped')),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        deleted_at TEXT DEFAULT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_task_completions_task ON task_completions(task_id);
      CREATE INDEX IF NOT EXISTS idx_task_completions_date ON task_completions(completion_date);`,
    ],
  ];

  for (const [name, sql] of migrations) {
    if (!applied.has(name)) {
      database.exec(sql);
      database.exec({
        sql: "INSERT INTO _migrations(name) VALUES(?)",
        bind: [name],
      });
    }
  }
}

self.onmessage = async (e: MessageEvent) => {
  const { id, method, params } = e.data;

  try {
    await init();

    switch (method) {
      case "open": {
        if (db) db.close();
        db = new sqlite3!.oo1.OpfsDb(params.path, "ct");
        runMigrations(db);
        self.postMessage({ id, result: null });
        break;
      }

      case "getPath": {
        self.postMessage({ id, result: params.path });
        break;
      }

      case "exec": {
        const d = getDb();
        if (params.bind !== undefined) {
          d.exec({ sql: params.sql, bind: params.bind });
        } else {
          d.exec(params.sql);
        }
        self.postMessage({ id, result: null });
        break;
      }

      case "selectValue": {
        const d = getDb();
        const val = d.selectValue(params.sql, params.bind);
        self.postMessage({ id, result: val });
        break;
      }

      case "selectValues": {
        const d = getDb();
        const vals = d.selectValues(params.sql, params.bind);
        self.postMessage({ id, result: vals });
        break;
      }

      case "selectObject": {
        const d = getDb();
        const obj = d.selectObject(params.sql, params.bind);
        self.postMessage({ id, result: obj });
        break;
      }

      case "selectObjects": {
        const d = getDb();
        const objs = d.selectObjects(params.sql, params.bind);
        self.postMessage({ id, result: objs });
        break;
      }

      case "close": {
        if (db) {
          db.close();
          db = null;
        }
        self.postMessage({ id, result: null });
        break;
      }

      default:
        throw new Error(`Unknown method: ${method}`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    self.postMessage({ id, error: message });
  }
};
