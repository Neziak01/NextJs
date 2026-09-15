import { randomUUID } from "node:crypto";
import { db, row, rows } from "./db";
import { publish } from "./bus";
import { MEMORY_KINDS, type MemoryEntry, type MemoryKind, type MemoryRevision } from "./types";

/**
 * Mémoire commune à tous les agents.
 *
 * Trois garanties tiennent tout le reste :
 *  1. un souvenir est versionné — on ne perd jamais ce qu'un agent avait compris avant ;
 *  2. il a une portée (`global` ou `project:<slug>`) — un agent ne voit que ce qui le concerne ;
 *  3. il porte une confiance, qui monte quand un fait est reconfirmé et baisse quand il est contredit.
 */

type MemoryRow = {
  id: string;
  kind: string;
  scope: string;
  title: string;
  body: string;
  tags: string;
  source: string | null;
  confidence: number;
  pinned: number;
  version: number;
  created_at: number;
  updated_at: number;
  superseded_by: string | null;
};

function toEntry(r: MemoryRow & { score?: number }): MemoryEntry {
  return {
    id: r.id,
    kind: r.kind as MemoryKind,
    scope: r.scope,
    title: r.title,
    body: r.body,
    tags: safeTags(r.tags),
    source: r.source,
    confidence: r.confidence,
    pinned: r.pinned === 1,
    version: r.version,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    supersededBy: r.superseded_by,
    ...(typeof r.score === "number" ? { score: r.score } : {}),
  };
}

function safeTags(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function isMemoryKind(value: string): value is MemoryKind {
  return (MEMORY_KINDS as readonly string[]).includes(value);
}

/** Normalise un titre pour repérer un souvenir déjà connu sans dépendre de la casse. */
function fingerprint(title: string): string {
  return title.toLowerCase().replace(/\s+/g, " ").trim();
}

export type RememberInput = {
  title: string;
  body: string;
  kind?: MemoryKind;
  scope?: string;
  tags?: string[];
  source?: string | null;
  confidence?: number;
  pinned?: boolean;
  changeNote?: string | null;
};

/**
 * Écrit ou fait évoluer un souvenir.
 *
 * Si un souvenir de même titre existe dans la même portée, il est mis à jour :
 * la version passe à n+1, l'ancienne est archivée dans `memory_revisions`, et la
 * confiance remonte (un fait reconfirmé vaut plus qu'un fait vu une seule fois).
 */
export function remember(input: RememberInput): { entry: MemoryEntry; created: boolean } {
  const now = Date.now();
  const scope = input.scope?.trim() || "global";
  const title = input.title.trim();
  if (!title) throw new Error("memory.remember: titre vide");
  if (!input.body?.trim()) throw new Error("memory.remember: contenu vide");

  const existing = row<MemoryRow>(
    db()
      .prepare(
        `SELECT * FROM memory
         WHERE scope = ? AND lower(trim(title)) = ? AND superseded_by IS NULL
         LIMIT 1`,
      )
      .get(scope, fingerprint(title)),
  );

  if (!existing) {
    const entry: MemoryRow = {
      id: randomUUID(),
      kind: input.kind ?? "fact",
      scope,
      title,
      body: input.body.trim(),
      tags: JSON.stringify(input.tags ?? []),
      source: input.source ?? null,
      confidence: clampConfidence(input.confidence ?? 0.7),
      pinned: input.pinned ? 1 : 0,
      version: 1,
      created_at: now,
      updated_at: now,
      superseded_by: null,
    };
    db()
      .prepare(
        `INSERT INTO memory (id, kind, scope, title, body, tags, source, confidence, pinned, version, created_at, updated_at, superseded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      )
      .run(
        entry.id,
        entry.kind,
        entry.scope,
        entry.title,
        entry.body,
        entry.tags,
        entry.source,
        entry.confidence,
        entry.pinned,
        entry.version,
        entry.created_at,
        entry.updated_at,
      );
    const created = toEntry(entry);
    publish("memory", { action: "created", entry: created });
    return { entry: created, created: true };
  }

  // On archive l'état précédent avant d'écraser : c'est ce qui rend la mémoire relisible.
  db()
    .prepare(
      `INSERT INTO memory_revisions (memory_id, version, title, body, confidence, source, changed_at, change_note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      existing.id,
      existing.version,
      existing.title,
      existing.body,
      existing.confidence,
      existing.source,
      now,
      input.changeNote ?? null,
    );

  const bodyChanged = existing.body.trim() !== input.body.trim();
  const confidence = clampConfidence(
    input.confidence ?? (bodyChanged ? existing.confidence : existing.confidence + 0.05),
  );
  const mergedTags = Array.from(new Set([...safeTags(existing.tags), ...(input.tags ?? [])]));

  db()
    .prepare(
      `UPDATE memory SET
         kind = ?, body = ?, tags = ?, source = ?, confidence = ?, pinned = ?,
         version = version + 1, updated_at = ?
       WHERE id = ?`,
    )
    .run(
      input.kind ?? existing.kind,
      input.body.trim(),
      JSON.stringify(mergedTags),
      input.source ?? existing.source,
      confidence,
      input.pinned === undefined ? existing.pinned : input.pinned ? 1 : 0,
      now,
      existing.id,
    );

  const updated = getMemory(existing.id);
  if (!updated) throw new Error("memory.remember: mise à jour perdue");
  publish("memory", { action: "updated", entry: updated });
  return { entry: updated, created: false };
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function getMemory(id: string): MemoryEntry | null {
  const r = row<MemoryRow>(db().prepare("SELECT * FROM memory WHERE id = ?").get(id));
  return r ? toEntry(r) : null;
}

export function revisions(memoryId: string): MemoryRevision[] {
  type RevRow = {
    id: number;
    memory_id: string;
    version: number;
    title: string;
    body: string;
    confidence: number;
    source: string | null;
    changed_at: number;
    change_note: string | null;
  };
  return rows<RevRow>(
    db()
      .prepare("SELECT * FROM memory_revisions WHERE memory_id = ? ORDER BY version DESC")
      .all(memoryId),
  ).map((r) => ({
    id: r.id,
    memoryId: r.memory_id,
    version: r.version,
    title: r.title,
    body: r.body,
    confidence: r.confidence,
    source: r.source,
    changedAt: r.changed_at,
    changeNote: r.change_note,
  }));
}

/** Les portées visibles depuis un projet : le global plus le projet lui-même. */
function scopesFor(projectId?: string | null): string[] {
  return projectId ? ["global", `project:${projectId}`] : ["global"];
}

/**
 * Prépare une requête FTS5 tolérante : chaque mot devient un préfixe entre guillemets,
 * ce qui évite qu'un apostrophe ou un opérateur saisi par un agent casse la recherche.
 */
function ftsQuery(query: string): string | null {
  const tokens = query
    .toLowerCase()
    .split(/[^\p{L}\p{N}_-]+/u)
    .filter((t) => t.length > 1)
    .slice(0, 12);
  if (!tokens.length) return null;
  return tokens.map((t) => `"${t.replace(/"/g, '""')}"*`).join(" OR ");
}

export type RecallOptions = {
  query?: string;
  /** `undefined` = toutes portées (vue d'ensemble) ; `null` = global seul ; sinon global + ce projet. */
  projectId?: string | null;
  scope?: string;
  kind?: MemoryKind;
  limit?: number;
  includeSuperseded?: boolean;
};

/** Recherche dans la mémoire, en pondérant pertinence, épinglage, confiance et fraîcheur. */
export function recall(options: RecallOptions = {}): MemoryEntry[] {
  const limit = Math.min(options.limit ?? 20, 200);
  const filters: string[] = [];
  const params: (string | number)[] = [];

  if (options.scope) {
    filters.push("m.scope = ?");
    params.push(options.scope);
  } else if (options.projectId !== undefined) {
    const scopes = scopesFor(options.projectId);
    filters.push(`m.scope IN (${scopes.map(() => "?").join(", ")})`);
    params.push(...scopes);
  }

  if (!options.includeSuperseded) filters.push("m.superseded_by IS NULL");
  // `filters` n'est jamais vide grâce à cette clause : le WHERE reste valide sans filtre de portée.
  if (options.kind) {
    filters.push("m.kind = ?");
    params.push(options.kind);
  }

  const match = options.query ? ftsQuery(options.query) : null;

  if (match) {
    const sql = `
      SELECT m.*, bm25(memory_fts) AS rank
      FROM memory_fts
      JOIN memory m ON m.rowid = memory_fts.rowid
      WHERE memory_fts MATCH ? AND ${filters.join(" AND ")}
      ORDER BY (m.pinned * -5) + rank - (m.confidence * 2) ASC
      LIMIT ?`;
    return rows<MemoryRow & { rank: number }>(db().prepare(sql).all(match, ...params, limit)).map((r) =>
      toEntry({ ...r, score: -r.rank }),
    );
  }

  const sql = `SELECT m.* FROM memory m
    WHERE ${filters.join(" AND ")}
    ORDER BY m.pinned DESC, m.updated_at DESC
    LIMIT ?`;
  return rows<MemoryRow>(db().prepare(sql).all(...params, limit)).map(toEntry);
}

/** Marque un souvenir comme dépassé par un autre, sans jamais effacer l'historique. */
export function supersede(id: string, replacementId: string | null): MemoryEntry | null {
  db().prepare("UPDATE memory SET superseded_by = ?, updated_at = ? WHERE id = ?").run(
    replacementId,
    Date.now(),
    id,
  );
  const entry = getMemory(id);
  if (entry) publish("memory", { action: "superseded", entry });
  return entry;
}

export function forget(id: string): boolean {
  const info = db().prepare("DELETE FROM memory WHERE id = ?").run(id);
  db().prepare("DELETE FROM memory_revisions WHERE memory_id = ?").run(id);
  const removed = info.changes > 0;
  if (removed) publish("memory", { action: "forgotten", id });
  return removed;
}

export function memoryStats(): { total: number; byKind: Record<string, number>; byScope: Record<string, number> } {
  const total = row<{ n: number }>(
    db().prepare("SELECT COUNT(*) AS n FROM memory WHERE superseded_by IS NULL").get(),
  );
  const byKind: Record<string, number> = {};
  for (const r of rows<{ kind: string; n: number }>(
    db()
      .prepare("SELECT kind, COUNT(*) AS n FROM memory WHERE superseded_by IS NULL GROUP BY kind")
      .all(),
  )) {
    byKind[r.kind] = r.n;
  }
  const byScope: Record<string, number> = {};
  for (const r of rows<{ scope: string; n: number }>(
    db()
      .prepare("SELECT scope, COUNT(*) AS n FROM memory WHERE superseded_by IS NULL GROUP BY scope")
      .all(),
  )) {
    byScope[r.scope] = r.n;
  }
  return { total: total?.n ?? 0, byKind, byScope };
}

/**
 * Brief markdown à injecter en tête de contexte d'un agent.
 * C'est la forme sous laquelle la mémoire commune arrive réellement dans un agent.
 */
export function contextPack(options: { projectId?: string | null; query?: string; limit?: number } = {}): string {
  const limit = options.limit ?? 25;
  const projectId = options.projectId ?? null;
  const pinned = recall({ projectId, limit: 10 }).filter((e) => e.pinned);
  const relevant = recall({ projectId, query: options.query, limit });
  const seen = new Set<string>();
  const ordered = [...pinned, ...relevant].filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });

  if (!ordered.length) return "# Mémoire Jarvis\n\n_Aucun souvenir enregistré pour ce périmètre._\n";

  const sections = new Map<string, MemoryEntry[]>();
  for (const entry of ordered) {
    const list = sections.get(entry.kind) ?? [];
    list.push(entry);
    sections.set(entry.kind, list);
  }

  const labels: Record<string, string> = {
    decision: "Décisions actées",
    preference: "Préférences",
    fact: "Faits",
    pattern: "Patterns",
    glossary: "Glossaire",
    person: "Personnes",
    pitfall: "Pièges connus",
  };
  // Les décisions et préférences d'abord : en cas de contexte tronqué, ce sont elles qui doivent survivre.
  const order = ["decision", "preference", "pitfall", "fact", "pattern", "glossary", "person"];

  const lines: string[] = [
    "# Mémoire Jarvis",
    "",
    options.projectId ? `Portée : \`global\` + \`project:${options.projectId}\`` : "Portée : `global`",
    "",
  ];

  for (const kind of order) {
    const list = sections.get(kind);
    if (!list?.length) continue;
    lines.push(`## ${labels[kind] ?? kind}`, "");
    for (const entry of list) {
      const marks = [entry.pinned ? "📌" : null, `confiance ${Math.round(entry.confidence * 100)}%`]
        .filter(Boolean)
        .join(" · ");
      lines.push(`- **${entry.title}** — ${entry.body} _(${marks})_`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
