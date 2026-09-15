"use client";

import { useState } from "react";
import type { MemoryEntry, Project } from "@/lib/types";
import { KIND_COLOR, KIND_LABEL, relativeTime, shortPath } from "@/lib/format";
import { useJson, useLiveRefresh, useNow } from "./useLive";
import { Empty, Panel, Tag } from "./ui";

export function ProjectsView() {
  const projects = useJson<{ projects: Project[] }>("/api/projects", { projects: [] });
  const [selected, setSelected] = useState<string | null>(null);

  const memory = useJson<{ entries: MemoryEntry[] }>(
    selected ? `/api/memory?limit=30&projectId=${encodeURIComponent(selected)}` : "/api/memory?limit=30",
    { entries: [] },
  );

  useLiveRefresh(() => {
    void projects.refresh();
    void memory.refresh();
  });

  const now = useNow();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Projets</h1>
        <p className="text-sm text-[var(--muted)]">
          Chaque projet est créé automatiquement dès qu&apos;un agent émet un événement depuis son dossier.
        </p>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel title={`Projets (${projects.data.projects.length})`}>
          {projects.data.projects.length ? (
            <ul>
              {projects.data.projects.map((project) => (
                <li key={project.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(selected === project.id ? null : project.id)}
                    aria-pressed={selected === project.id}
                    className={`block w-full cursor-pointer border-b border-[var(--border)] px-4 py-3 text-left transition hover:bg-[var(--bg-elevated)] ${
                      selected === project.id ? "bg-[var(--bg-elevated)]" : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{project.name}</span>
                      <Tag color={project.status === "active" ? "var(--green)" : "var(--muted)"}>{project.status}</Tag>
                      {(project.liveAgents ?? 0) > 0 && <Tag color="var(--green)">{project.liveAgents} en vol</Tag>}
                      <Tag color="var(--violet)">{project.memoryCount} souvenirs</Tag>
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">{project.description ?? "—"}</p>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 font-mono text-[11px] text-[var(--muted)]">
                      <span>{shortPath(project.path)}</span>
                      <span>{project.eventsLast24h} évts / 24 h</span>
                      <span>{relativeTime(project.lastActivityAt, now)}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Aucun projet. Lance un agent avec les hooks Jarvis installés.</Empty>
          )}
        </Panel>

        <Panel title={selected ? `Mémoire — ${selected}` : "Mémoire — toutes portées"}>
          {memory.data.entries.length ? (
            <ul className="max-h-[560px] overflow-y-auto">
              {memory.data.entries.map((entry) => (
                <li key={entry.id} className="border-b border-[var(--border)] px-4 py-3 last:border-b-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag color={KIND_COLOR[entry.kind]}>{KIND_LABEL[entry.kind] ?? entry.kind}</Tag>
                    <span className="font-medium">{entry.title}</span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">{entry.body}</p>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Pas encore de souvenir pour ce périmètre.</Empty>
          )}
        </Panel>
      </div>
    </div>
  );
}
