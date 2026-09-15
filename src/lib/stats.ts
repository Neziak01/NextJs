import { db, row } from "./db";
import { memoryStats } from "./memory";

export type Pulse = { bucket: number; count: number };

export type Overview = {
  liveAgents: number;
  sessionsToday: number;
  eventsLastHour: number;
  toolCallsToday: number;
  errorsToday: number;
  projectsActive: number;
  memory: ReturnType<typeof memoryStats>;
  pulse: Pulse[];
};

const STALE_AFTER_MS = 5 * 60 * 1000;

function count(sql: string, ...params: (string | number)[]): number {
  return row<{ n: number }>(db().prepare(sql).get(...params))?.n ?? 0;
}

/** Chiffres de tête du dashboard + courbe d'activité des 60 dernières minutes. */
export function overview(): Overview {
  const now = Date.now();
  const dayAgo = now - 86_400_000;
  const hourAgo = now - 3_600_000;

  const pulse: Pulse[] = [];
  const buckets = db()
    .prepare(
      `SELECT (ts / 60000) AS bucket, COUNT(*) AS count
       FROM events WHERE ts > ? GROUP BY bucket ORDER BY bucket ASC`,
    )
    .all(hourAgo) as { bucket: number; count: number }[];
  const map = new Map(buckets.map((b) => [Number(b.bucket), Number(b.count)]));
  const startBucket = Math.floor(hourAgo / 60000);
  for (let i = 0; i <= 60; i++) {
    const bucket = startBucket + i;
    pulse.push({ bucket, count: map.get(bucket) ?? 0 });
  }

  return {
    liveAgents: count(
      "SELECT COUNT(*) AS n FROM sessions WHERE status IN ('running','waiting') AND last_seen_at > ?",
      now - STALE_AFTER_MS,
    ),
    sessionsToday: count("SELECT COUNT(*) AS n FROM sessions WHERE started_at > ?", dayAgo),
    eventsLastHour: count("SELECT COUNT(*) AS n FROM events WHERE ts > ?", hourAgo),
    toolCallsToday: count("SELECT COUNT(*) AS n FROM events WHERE event_type = 'PreToolUse' AND ts > ?", dayAgo),
    errorsToday: count("SELECT COUNT(*) AS n FROM events WHERE event_type = 'PostToolUseFailure' AND ts > ?", dayAgo),
    projectsActive: count("SELECT COUNT(*) AS n FROM projects WHERE status = 'active'"),
    memory: memoryStats(),
    pulse,
  };
}
