import { db, row, rows } from "./db";
import { publish } from "./bus";
import type { AgentEvent, AgentSession, SessionStatus } from "./types";

/** Au-delà de ce délai sans événement, une session « running » est requalifiée en idle. */
const STALE_AFTER_MS = 5 * 60 * 1000;

type RawEvent = {
  sourceApp?: string;
  sessionId?: string;
  agentId?: string;
  agentType?: string | null;
  eventType: string;
  toolName?: string | null;
  summary?: string | null;
  cwd?: string | null;
  model?: string | null;
  projectId?: string | null;
  parentSessionId?: string | null;
  prompt?: string | null;
  ts?: number;
  payload?: Record<string, unknown> | null;
};

/** Statut d'une session déduit du type d'événement le plus récent. */
function statusFor(eventType: string): SessionStatus {
  switch (eventType) {
    case "SessionEnd":
      return "done";
    case "Stop":
      return "idle";
    case "PermissionRequest":
    case "Notification":
      return "waiting";
    case "PostToolUseFailure":
      return "error";
    default:
      return "running";
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/** Crée le projet s'il n'existe pas encore : un agent qui tourne suffit à le déclarer. */
function ensureProject(id: string, name: string, path: string | null, now: number): void {
  const existing = db().prepare("SELECT id FROM projects WHERE id = ?").get(id);
  if (existing) {
    db()
      .prepare("UPDATE projects SET updated_at = ?, path = COALESCE(path, ?) WHERE id = ?")
      .run(now, path, id);
    return;
  }
  db()
    .prepare(
      `INSERT INTO projects (id, name, description, repo, path, status, created_at, updated_at)
       VALUES (?, ?, NULL, NULL, ?, 'active', ?, ?)`,
    )
    .run(id, name, path, now, now);
}

/**
 * Enregistre un événement de hook et met la session à jour dans la foulée.
 * C'est le seul point d'entrée de la télémétrie : hooks, MCP et scripts passent par là.
 */
export function ingest(raw: RawEvent): AgentEvent {
  const now = Date.now();
  const ts = typeof raw.ts === "number" ? raw.ts : now;
  const sourceApp = raw.sourceApp?.trim() || "unknown";
  const sessionId = raw.sessionId?.trim() || `anon-${ts}`;
  const agentId = raw.agentId?.trim() || "main";
  const projectId = raw.projectId?.trim() || slugify(sourceApp);

  ensureProject(projectId, sourceApp, raw.cwd ?? null, now);

  const info = db()
    .prepare(
      `INSERT INTO events
        (ts, source_app, session_id, agent_id, agent_type, event_type, tool_name, summary, cwd, model, payload)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      ts,
      sourceApp,
      sessionId,
      agentId,
      raw.agentType ?? null,
      raw.eventType,
      raw.toolName ?? null,
      raw.summary ?? null,
      raw.cwd ?? null,
      raw.model ?? null,
      raw.payload ? JSON.stringify(raw.payload) : null,
    );

  const status = statusFor(raw.eventType);
  const isToolCall = raw.eventType === "PreToolUse";
  const isError = raw.eventType === "PostToolUseFailure";

  db()
    .prepare(
      `INSERT INTO sessions
        (session_id, source_app, project_id, agent_id, agent_type, cwd, model,
         started_at, last_seen_at, ended_at, status, last_prompt, last_event_type,
         last_tool_name, tool_calls, errors, parent_session_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(session_id) DO UPDATE SET
         last_seen_at    = excluded.last_seen_at,
         status          = excluded.status,
         last_event_type = excluded.last_event_type,
         cwd             = COALESCE(excluded.cwd, sessions.cwd),
         model           = COALESCE(excluded.model, sessions.model),
         agent_type      = COALESCE(excluded.agent_type, sessions.agent_type),
         project_id      = COALESCE(sessions.project_id, excluded.project_id),
         last_prompt     = COALESCE(excluded.last_prompt, sessions.last_prompt),
         last_tool_name  = COALESCE(excluded.last_tool_name, sessions.last_tool_name),
         ended_at        = CASE WHEN excluded.status = 'done' THEN excluded.last_seen_at ELSE sessions.ended_at END,
         tool_calls      = sessions.tool_calls + ?,
         errors          = sessions.errors + ?`,
    )
    .run(
      sessionId,
      sourceApp,
      projectId,
      agentId,
      raw.agentType ?? null,
      raw.cwd ?? null,
      raw.model ?? null,
      ts,
      ts,
      status === "done" ? ts : null,
      status,
      raw.prompt ?? null,
      raw.eventType,
      raw.toolName ?? null,
      isToolCall ? 1 : 0,
      isError ? 1 : 0,
      raw.parentSessionId ?? null,
      isToolCall ? 1 : 0,
      isError ? 1 : 0,
    );

  const event: AgentEvent = {
    id: Number(info.lastInsertRowid),
    ts,
    sourceApp,
    sessionId,
    agentId,
    agentType: raw.agentType ?? null,
    eventType: raw.eventType,
    toolName: raw.toolName ?? null,
    summary: raw.summary ?? null,
    cwd: raw.cwd ?? null,
    model: raw.model ?? null,
    payload: raw.payload ?? null,
  };

  publish("event", event);
  return event;
}

type EventRow = {
  id: number;
  ts: number;
  source_app: string;
  session_id: string;
  agent_id: string;
  agent_type: string | null;
  event_type: string;
  tool_name: string | null;
  summary: string | null;
  cwd: string | null;
  model: string | null;
  payload: string | null;
};

function toEvent(r: EventRow): AgentEvent {
  return {
    id: r.id,
    ts: r.ts,
    sourceApp: r.source_app,
    sessionId: r.session_id,
    agentId: r.agent_id,
    agentType: r.agent_type,
    eventType: r.event_type,
    toolName: r.tool_name,
    summary: r.summary,
    cwd: r.cwd,
    model: r.model,
    payload: r.payload ? (JSON.parse(r.payload) as Record<string, unknown>) : null,
  };
}

export function listEvents(options: {
  limit?: number;
  sessionId?: string;
  projectId?: string;
  since?: number;
} = {}): AgentEvent[] {
  const limit = Math.min(options.limit ?? 100, 500);
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (options.sessionId) {
    where.push("e.session_id = ?");
    params.push(options.sessionId);
  }
  if (options.projectId) {
    where.push("e.session_id IN (SELECT session_id FROM sessions WHERE project_id = ?)");
    params.push(options.projectId);
  }
  if (options.since) {
    where.push("e.ts > ?");
    params.push(options.since);
  }

  const sql = `SELECT e.* FROM events e
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY e.ts DESC, e.id DESC LIMIT ?`;

  return rows<EventRow>(db().prepare(sql).all(...params, limit)).map(toEvent);
}

type SessionRow = {
  session_id: string;
  source_app: string;
  project_id: string | null;
  agent_id: string;
  agent_type: string | null;
  cwd: string | null;
  model: string | null;
  started_at: number;
  last_seen_at: number;
  ended_at: number | null;
  status: string;
  last_prompt: string | null;
  last_event_type: string | null;
  last_tool_name: string | null;
  tool_calls: number;
  errors: number;
  parent_session_id: string | null;
};

function toSession(r: SessionRow, now: number): AgentSession {
  // Une session qui ne parle plus n'est pas « en cours » : on la requalifie à la lecture
  // plutôt qu'avec une tâche de fond, pour rester sans process additionnel.
  const stale = r.status !== "done" && now - r.last_seen_at > STALE_AFTER_MS;
  return {
    sessionId: r.session_id,
    sourceApp: r.source_app,
    projectId: r.project_id,
    agentId: r.agent_id,
    agentType: r.agent_type,
    cwd: r.cwd,
    model: r.model,
    startedAt: r.started_at,
    lastSeenAt: r.last_seen_at,
    endedAt: r.ended_at,
    status: (stale ? "idle" : r.status) as SessionStatus,
    lastPrompt: r.last_prompt,
    lastEventType: r.last_event_type,
    lastToolName: r.last_tool_name,
    toolCalls: r.tool_calls,
    errors: r.errors,
    parentSessionId: r.parent_session_id,
  };
}

export function listSessions(options: { limit?: number; projectId?: string } = {}): AgentSession[] {
  const now = Date.now();
  const limit = Math.min(options.limit ?? 50, 200);
  const sql = `SELECT * FROM sessions
    ${options.projectId ? "WHERE project_id = ?" : ""}
    ORDER BY last_seen_at DESC LIMIT ?`;
  const params = options.projectId ? [options.projectId, limit] : [limit];
  return rows<SessionRow>(db().prepare(sql).all(...params)).map((r) => toSession(r, now));
}

export function getSession(sessionId: string): AgentSession | null {
  const r = row<SessionRow>(db().prepare("SELECT * FROM sessions WHERE session_id = ?").get(sessionId));
  return r ? toSession(r, Date.now()) : null;
}
