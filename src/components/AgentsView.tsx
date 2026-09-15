"use client";

import { useMemo, useState } from "react";
import type { AgentEvent, AgentSession } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/format";
import { useJson, useLiveRefresh, useNow } from "./useLive";
import { AgentCard, EventFeed } from "./agents";
import { Empty, Panel } from "./ui";

const FILTERS = ["all", "running", "waiting", "idle", "done", "error"] as const;

export function AgentsView() {
  const sessions = useJson<{ sessions: AgentSession[] }>("/api/sessions?limit=100", { sessions: [] });
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const detail = useJson<{ events: AgentEvent[] }>(
    selected ? `/api/events?limit=120&sessionId=${encodeURIComponent(selected)}` : "/api/events?limit=120",
    { events: [] },
  );

  useLiveRefresh(() => {
    void sessions.refresh();
    void detail.refresh();
  });

  const now = useNow();

  const visible = useMemo(
    () => sessions.data.sessions.filter((s) => filter === "all" || s.status === filter),
    [sessions.data.sessions, filter],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Agents</h1>
          <p className="text-sm text-[var(--muted)]">
            Une ligne par session. Clique pour isoler son flux d&apos;événements.
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className={`rounded-lg border px-2.5 py-1 text-xs transition ${
                filter === value
                  ? "border-[var(--accent-dim)] bg-[var(--bg-elevated)] text-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              {value === "all" ? "tous" : STATUS_LABEL[value]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Panel title={`Sessions (${visible.length})`}>
          {visible.length ? (
            visible.map((session) => (
              <button
                key={session.sessionId}
                type="button"
                onClick={() => setSelected(selected === session.sessionId ? null : session.sessionId)}
                aria-pressed={selected === session.sessionId}
                className={`block w-full cursor-pointer text-left transition hover:bg-[var(--bg-elevated)] ${
                  selected === session.sessionId ? "bg-[var(--bg-elevated)]" : ""
                }`}
              >
                <AgentCard session={session} now={now} />
              </button>
            ))
          ) : (
            <Empty>Aucune session dans ce filtre.</Empty>
          )}
        </Panel>

        <Panel title={selected ? `Flux — ${selected.slice(0, 12)}…` : "Flux — toutes sessions"}>
          <EventFeed events={detail.data.events} now={now} />
        </Panel>
      </div>
    </div>
  );
}
