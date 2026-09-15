import { db, row, rows } from "./db";
import type { Project, ProjectStatus } from "./types";

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  repo: string | null;
  path: string | null;
  status: string;
  created_at: number;
  updated_at: number;
  live_agents?: number;
  events_24h?: number;
  last_activity_at?: number | null;
  memory_count?: number;
};

const STALE_AFTER_MS = 5 * 60 * 1000;

function toProject(r: ProjectRow): Project {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    repo: r.repo,
    path: r.path,
    status: r.status as ProjectStatus,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    liveAgents: r.live_agents ?? 0,
    eventsLast24h: r.events_24h ?? 0,
    lastActivityAt: r.last_activity_at ?? null,
    memoryCount: r.memory_count ?? 0,
  };
}

/** Projets enrichis de leurs agrégats live — c'est la vue « projets en cours » du dashboard. */
export function listProjects(): Project[] {
  const now = Date.now();
  const sql = `
    SELECT p.*,
      (SELECT COUNT(*) FROM sessions s
         WHERE s.project_id = p.id
           AND s.status IN ('running','waiting')
           AND s.last_seen_at > ?)                                   AS live_agents,
      (SELECT COUNT(*) FROM events e
         JOIN sessions s2 ON s2.session_id = e.session_id
         WHERE s2.project_id = p.id AND e.ts > ?)                    AS events_24h,
      (SELECT MAX(s3.last_seen_at) FROM sessions s3
         WHERE s3.project_id = p.id)                                 AS last_activity_at,
      (SELECT COUNT(*) FROM memory m
         WHERE m.scope = 'project:' || p.id AND m.superseded_by IS NULL) AS memory_count
    FROM projects p
    ORDER BY (last_activity_at IS NULL), last_activity_at DESC, p.updated_at DESC`;

  return rows<ProjectRow>(db().prepare(sql).all(now - STALE_AFTER_MS, now - 86_400_000)).map(toProject);
}

export function getProject(id: string): Project | null {
  return listProjects().find((p) => p.id === id) ?? null;
}

export type ProjectInput = {
  id: string;
  name?: string;
  description?: string | null;
  repo?: string | null;
  path?: string | null;
  status?: ProjectStatus;
};

/** Crée ou met à jour une fiche projet ; seuls les champs fournis sont écrasés. */
export function upsertProject(input: ProjectInput): Project {
  const now = Date.now();
  const existing = row<ProjectRow>(db().prepare("SELECT * FROM projects WHERE id = ?").get(input.id));

  if (!existing) {
    db()
      .prepare(
        `INSERT INTO projects (id, name, description, repo, path, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.id,
        input.name ?? input.id,
        input.description ?? null,
        input.repo ?? null,
        input.path ?? null,
        input.status ?? "active",
        now,
        now,
      );
  } else {
    db()
      .prepare(
        `UPDATE projects SET name = ?, description = ?, repo = ?, path = ?, status = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(
        input.name ?? existing.name,
        input.description === undefined ? existing.description : input.description,
        input.repo === undefined ? existing.repo : input.repo,
        input.path === undefined ? existing.path : input.path,
        input.status ?? existing.status,
        now,
        input.id,
      );
  }

  const project = getProject(input.id);
  if (!project) throw new Error(`projects.upsert: projet ${input.id} introuvable après écriture`);
  return project;
}

export function deleteProject(id: string): boolean {
  return db().prepare("DELETE FROM projects WHERE id = ?").run(id).changes > 0;
}
