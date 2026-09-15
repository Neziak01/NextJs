"use client";

import { clock, duration, relativeTime, shortPath } from "@/lib/format";
import type { AgentEvent, AgentSession } from "@/lib/types";
import { Empty, StatusDot, Tag } from "./ui";

/** Couleur de l'événement dans le flux : l'œil doit accrocher les échecs et les attentes. */
const EVENT_COLOR: Record<string, string> = {
  PostToolUseFailure: "var(--red)",
  PermissionRequest: "var(--amber)",
  Notification: "var(--amber)",
  UserPromptSubmit: "var(--violet)",
  SessionStart: "var(--green)",
  SubagentStart: "var(--green)",
  SessionEnd: "var(--muted)",
  Stop: "var(--muted)",
};

export function AgentCard({ session, now }: { session: AgentSession; now: number }) {
  const live = session.status === "running" || session.status === "waiting";
  return (
    <article className="border-b border-[var(--border)] px-4 py-3 last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <StatusDot status={session.status} live={live} />
          <span className="truncate font-medium">{session.agentType ?? session.agentId}</span>
          <Tag>{session.sourceApp}</Tag>
        </div>
        <span className="font-mono text-xs text-[var(--muted)]">{relativeTime(session.lastSeenAt, now)}</span>
      </div>

      {session.lastPrompt && (
        <p className="mt-1.5 line-clamp-2 text-sm text-[var(--muted)]">{session.lastPrompt}</p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-[var(--muted)]">
        <span>{session.lastEventType ?? "—"}{session.lastToolName ? ` · ${session.lastToolName}` : ""}</span>
        <span>{session.toolCalls} outils</span>
        {session.errors > 0 && <span style={{ color: "var(--red)" }}>{session.errors} erreurs</span>}
        <span>{duration(session.startedAt, session.endedAt ?? now)}</span>
        <span className="truncate">{shortPath(session.cwd)}</span>
      </div>
    </article>
  );
}

export function EventFeed({ events, now }: { events: AgentEvent[]; now: number }) {
  if (!events.length) return <Empty>Aucun événement reçu. Branche un agent avec `npm run jarvis:install-hooks`.</Empty>;

  return (
    <ol className="max-h-[520px] overflow-y-auto">
      {events.map((event) => {
        const color = EVENT_COLOR[event.eventType] ?? "var(--accent)";
        return (
          <li
            key={event.id}
            className="flex items-start gap-3 border-b border-[var(--border)] px-4 py-2 text-sm last:border-b-0"
          >
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full" style={{ background: color }} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-medium" style={{ color }}>
                  {event.eventType}
                </span>
                {event.toolName && <Tag>{event.toolName}</Tag>}
                <span className="font-mono text-[11px] text-[var(--muted)]">{event.sourceApp}</span>
              </div>
              {event.summary && <p className="mt-0.5 line-clamp-2 text-[var(--muted)]">{event.summary}</p>}
            </div>
            <time className="shrink-0 font-mono text-[11px] text-[var(--muted)]" dateTime={new Date(event.ts).toISOString()}>
              {clock(event.ts)}
            </time>
          </li>
        );
      })}
      <li className="px-4 py-2 text-center font-mono text-[10px] text-[var(--muted)]">
        {relativeTime(events.at(-1)?.ts, now)} — fin du flux chargé
      </li>
    </ol>
  );
}
