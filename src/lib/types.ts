/** Types partagés entre le serveur, les routes API et l'UI. */

/** Événements de cycle de vie émis par les hooks Claude Code. */
export const EVENT_TYPES = [
  "SessionStart",
  "SessionEnd",
  "UserPromptSubmit",
  "PreToolUse",
  "PostToolUse",
  "PostToolUseFailure",
  "PermissionRequest",
  "SubagentStart",
  "SubagentStop",
  "PreCompact",
  "Notification",
  "Stop",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export type AgentEvent = {
  id: number;
  ts: number;
  sourceApp: string;
  sessionId: string;
  agentId: string;
  agentType: string | null;
  eventType: EventType | string;
  toolName: string | null;
  summary: string | null;
  cwd: string | null;
  model: string | null;
  payload: Record<string, unknown> | null;
};

/** Statut dérivé d'une session à partir de son dernier événement. */
export type SessionStatus = "running" | "waiting" | "idle" | "done" | "error";

export type AgentSession = {
  sessionId: string;
  sourceApp: string;
  projectId: string | null;
  agentId: string;
  agentType: string | null;
  cwd: string | null;
  model: string | null;
  startedAt: number;
  lastSeenAt: number;
  endedAt: number | null;
  status: SessionStatus;
  lastPrompt: string | null;
  lastEventType: string | null;
  lastToolName: string | null;
  toolCalls: number;
  errors: number;
  parentSessionId: string | null;
};

export type ProjectStatus = "active" | "paused" | "done" | "archived";

export type Project = {
  id: string;
  name: string;
  description: string | null;
  repo: string | null;
  path: string | null;
  status: ProjectStatus;
  createdAt: number;
  updatedAt: number;
  /** Agrégats calculés à la lecture. */
  liveAgents?: number;
  eventsLast24h?: number;
  lastActivityAt?: number | null;
  memoryCount?: number;
};

/**
 * Nature d'un souvenir. Le `kind` pilote la façon dont la mémoire est injectée
 * dans le contexte d'un agent (les `decision` et `preference` priment).
 */
export const MEMORY_KINDS = [
  "fact",
  "decision",
  "preference",
  "pattern",
  "glossary",
  "person",
  "pitfall",
] as const;

export type MemoryKind = (typeof MEMORY_KINDS)[number];

export type MemoryEntry = {
  id: string;
  kind: MemoryKind;
  /** `global` ou `project:<slug>` — décide qui voit le souvenir. */
  scope: string;
  title: string;
  body: string;
  tags: string[];
  source: string | null;
  confidence: number;
  pinned: boolean;
  version: number;
  createdAt: number;
  updatedAt: number;
  supersededBy: string | null;
  /** Score de pertinence renvoyé par la recherche plein texte. */
  score?: number;
};

export type MemoryRevision = {
  id: number;
  memoryId: string;
  version: number;
  title: string;
  body: string;
  confidence: number;
  source: string | null;
  changedAt: number;
  changeNote: string | null;
};
