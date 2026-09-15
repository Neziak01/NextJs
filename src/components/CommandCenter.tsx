"use client";

import Link from "next/link";
import type { AgentEvent, AgentSession, MemoryEntry, Project } from "@/lib/types";
import type { Overview } from "@/lib/stats";
import { KIND_COLOR, KIND_LABEL, relativeTime } from "@/lib/format";
import { useJson, useLiveRefresh, useNow } from "./useLive";
import { AgentCard, EventFeed } from "./agents";
import { Empty, Kpi, Panel, Tag } from "./ui";
import { Pulse } from "./Pulse";

const EMPTY_OVERVIEW: Overview = {
  liveAgents: 0,
  sessionsToday: 0,
  eventsLastHour: 0,
  toolCallsToday: 0,
  errorsToday: 0,
  projectsActive: 0,
  memory: { total: 0, byKind: {}, byScope: {} },
  pulse: [],
};

export function CommandCenter() {
  const stats = useJson<Overview>("/api/stats", EMPTY_OVERVIEW);
  const sessions = useJson<{ sessions: AgentSession[] }>("/api/sessions?limit=12", { sessions: [] });
  const events = useJson<{ events: AgentEvent[] }>("/api/events?limit=60", { events: [] });
  const projects = useJson<{ projects: Project[] }>("/api/projects", { projects: [] });
  const memory = useJson<{ entries: MemoryEntry[] }>("/api/memory?limit=6", { entries: [] });

  const { connected, lastEventAt } = useLiveRefresh(() => {
    void stats.refresh();
    void sessions.refresh();
    void events.refresh();
    void projects.refresh();
    void memory.refresh();
  });

  const now = useNow();

  const liveSessions = sessions.data.sessions.filter((s) => s.status === "running" || s.status === "waiting");
  const activeProjects = projects.data.projects.filter((p) => p.status === "active").slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Poste de commandement</h1>
          <p className="text-sm text-[var(--muted)]">
            Agents en vol, projets ouverts et mémoire commune, en temps réel.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--muted)]">
          <span
            className="relative inline-block size-2 rounded-full"
            style={{ background: connected ? "var(--green)" : "var(--red)", color: "var(--green)" }}
          >
            {connected && <span className="live-dot" />}
          </span>
          {connected ? "flux connecté" : "flux interrompu"}
          {lastEventAt && now > 0 && <span>· dernier signal {relativeTime(lastEventAt, now)}</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Agents en vol" value={stats.data.liveAgents} tone="green" hint={`${stats.data.sessionsToday} sessions / 24 h`} />
        <Kpi label="Événements / h" value={stats.data.eventsLastHour} />
        <Kpi label="Appels d'outils" value={stats.data.toolCallsToday} hint="sur 24 h" tone="violet" />
        <Kpi label="Échecs" value={stats.data.errorsToday} tone={stats.data.errorsToday > 0 ? "red" : "accent"} hint="sur 24 h" />
        <Kpi label="Projets actifs" value={stats.data.projectsActive} tone="amber" />
        <Kpi label="Souvenirs" value={stats.data.memory.total} hint="mémoire commune" />
      </div>

      <Panel title="Pulse — 60 dernières minutes">
        <Pulse points={stats.data.pulse} />
      </Panel>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Panel
          title={`Agents en vol (${liveSessions.length})`}
          action={
            <Link href="/agents" className="text-xs text-[var(--accent)] hover:underline">
              tout voir
            </Link>
          }
        >
          {liveSessions.length ? (
            liveSessions.map((session) => <AgentCard key={session.sessionId} session={session} now={now} />)
          ) : (
            <Empty>Aucun agent actif. Les sessions terminées restent visibles dans l&apos;onglet Agents.</Empty>
          )}
        </Panel>

        <Panel title="Flux d'activité">
          <EventFeed events={events.data.events} now={now} />
        </Panel>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Panel
          title="Projets en cours"
          action={
            <Link href="/projects" className="text-xs text-[var(--accent)] hover:underline">
              tout voir
            </Link>
          }
        >
          {activeProjects.length ? (
            <ul>
              {activeProjects.map((project) => (
                <li key={project.id} className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 last:border-b-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{project.name}</span>
                      {(project.liveAgents ?? 0) > 0 && (
                        <Tag color="var(--green)">{project.liveAgents} en vol</Tag>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                      {project.description ?? project.path ?? "—"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right font-mono text-[11px] text-[var(--muted)]">
                    <div>{project.eventsLast24h} évts / 24 h</div>
                    <div>{relativeTime(project.lastActivityAt, now)}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Aucun projet enregistré pour l&apos;instant.</Empty>
          )}
        </Panel>

        <Panel
          title="Derniers souvenirs"
          action={
            <Link href="/memory" className="text-xs text-[var(--accent)] hover:underline">
              explorer
            </Link>
          }
        >
          {memory.data.entries.length ? (
            <ul>
              {memory.data.entries.map((entry) => (
                <li key={entry.id} className="border-b border-[var(--border)] px-4 py-3 last:border-b-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag color={KIND_COLOR[entry.kind]}>{KIND_LABEL[entry.kind] ?? entry.kind}</Tag>
                    <span className="font-medium">{entry.title}</span>
                    {entry.pinned && <span title="épinglé">📌</span>}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{entry.body}</p>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Mémoire vide. Ajoute un premier souvenir depuis l&apos;onglet Mémoire.</Empty>
          )}
        </Panel>
      </div>
    </div>
  );
}
