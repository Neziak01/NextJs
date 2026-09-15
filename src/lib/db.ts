import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Base unique de Jarvis : télémétrie des agents, projets et mémoire partagée.
 * On s'appuie sur `node:sqlite` pour garder le projet sans dépendance native.
 */

// `JARVIS_DB_PATH` doit être un chemin absolu ; sinon on retombe sur ./data/jarvis.db.
// Le chemin reste statiquement analysable, ce qui évite un avertissement de tracing au build.
const DB_PATH = process.env.JARVIS_DB_PATH || join(process.cwd(), "data", "jarvis.db");

let instance: DatabaseSync | null = null;

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS events (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  ts           INTEGER NOT NULL,
  source_app   TEXT NOT NULL,
  session_id   TEXT NOT NULL,
  agent_id     TEXT NOT NULL DEFAULT 'main',
  agent_type   TEXT,
  event_type   TEXT NOT NULL,
  tool_name    TEXT,
  summary      TEXT,
  cwd          TEXT,
  model        TEXT,
  payload      TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_app ON events(source_app, ts DESC);

CREATE TABLE IF NOT EXISTS sessions (
  session_id        TEXT PRIMARY KEY,
  source_app        TEXT NOT NULL,
  project_id        TEXT,
  agent_id          TEXT NOT NULL DEFAULT 'main',
  agent_type        TEXT,
  cwd               TEXT,
  model             TEXT,
  started_at        INTEGER NOT NULL,
  last_seen_at      INTEGER NOT NULL,
  ended_at          INTEGER,
  status            TEXT NOT NULL DEFAULT 'running',
  last_prompt       TEXT,
  last_event_type   TEXT,
  last_tool_name    TEXT,
  tool_calls        INTEGER NOT NULL DEFAULT 0,
  errors            INTEGER NOT NULL DEFAULT 0,
  parent_session_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_seen ON sessions(last_seen_at DESC);

CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  repo        TEXT,
  path        TEXT,
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS memory (
  id            TEXT PRIMARY KEY,
  kind          TEXT NOT NULL,
  scope         TEXT NOT NULL DEFAULT 'global',
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  tags          TEXT NOT NULL DEFAULT '[]',
  source        TEXT,
  confidence    REAL NOT NULL DEFAULT 0.7,
  pinned        INTEGER NOT NULL DEFAULT 0,
  version       INTEGER NOT NULL DEFAULT 1,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  superseded_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_memory_scope ON memory(scope, updated_at DESC);

CREATE TABLE IF NOT EXISTS memory_revisions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  memory_id   TEXT NOT NULL,
  version     INTEGER NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  confidence  REAL NOT NULL,
  source      TEXT,
  changed_at  INTEGER NOT NULL,
  change_note TEXT
);
CREATE INDEX IF NOT EXISTS idx_revisions_memory ON memory_revisions(memory_id, version DESC);

CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(
  title, body, tags, content='memory', content_rowid='rowid'
);

CREATE TRIGGER IF NOT EXISTS memory_ai AFTER INSERT ON memory BEGIN
  INSERT INTO memory_fts(rowid, title, body, tags)
  VALUES (new.rowid, new.title, new.body, new.tags);
END;
CREATE TRIGGER IF NOT EXISTS memory_ad AFTER DELETE ON memory BEGIN
  INSERT INTO memory_fts(memory_fts, rowid, title, body, tags)
  VALUES ('delete', old.rowid, old.title, old.body, old.tags);
END;
CREATE TRIGGER IF NOT EXISTS memory_au AFTER UPDATE ON memory BEGIN
  INSERT INTO memory_fts(memory_fts, rowid, title, body, tags)
  VALUES ('delete', old.rowid, old.title, old.body, old.tags);
  INSERT INTO memory_fts(rowid, title, body, tags)
  VALUES (new.rowid, new.title, new.body, new.tags);
END;
`;

/** Ouvre (et initialise au premier appel) la base partagée. */
export function db(): DatabaseSync {
  if (instance) return instance;
  mkdirSync(dirname(DB_PATH), { recursive: true });
  const handle = new DatabaseSync(DB_PATH);
  handle.exec(SCHEMA);
  instance = handle;
  return handle;
}

export function dbPath(): string {
  return DB_PATH;
}

/** Les lignes renvoyées par node:sqlite ont un prototype nul : on les normalise. */
export function rows<T>(value: unknown[]): T[] {
  return value.map((row) => ({ ...(row as object) })) as T[];
}

export function row<T>(value: unknown): T | null {
  return value ? ({ ...(value as object) } as T) : null;
}
