CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  timezone TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_recurring INTEGER DEFAULT 0,
  weekdays TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  PRIMARY KEY (id, user_id)
);

CREATE TABLE IF NOT EXISTS task_completions (
  id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  completion_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('completed', 'skipped')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  PRIMARY KEY (id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_updated ON tasks(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_task_completions_user_updated ON task_completions(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_task_completions_task_date ON task_completions(task_id, completion_date);
