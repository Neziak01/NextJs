"use client";

import { useState } from "react";
import type { MemoryEntry, MemoryKind, MemoryRevision } from "@/lib/types";
import { MEMORY_KINDS } from "@/lib/types";
import { KIND_COLOR, KIND_LABEL, relativeTime } from "@/lib/format";
import { useJson, useLiveRefresh, useNow } from "./useLive";
import { Empty, Panel, Tag } from "./ui";

export function MemoryView() {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<MemoryKind | "">("");
  const [scope, setScope] = useState("");

  const params = new URLSearchParams({ limit: "60" });
  if (query.trim()) params.set("q", query.trim());
  if (kind) params.set("kind", kind);
  if (scope.trim()) params.set("scope", scope.trim());

  const memory = useJson<{ entries: MemoryEntry[] }>(`/api/memory?${params}`, { entries: [] });
  const [selected, setSelected] = useState<string | null>(null);
  const detail = useJson<{ entry: MemoryEntry | null; revisions: MemoryRevision[] }>(
    selected ? `/api/memory/${selected}` : "/api/memory?limit=0",
    { entry: null, revisions: [] },
  );

  useLiveRefresh(() => {
    void memory.refresh();
    void detail.refresh();
  });

  const now = useNow();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Mémoire commune</h1>
        <p className="text-sm text-[var(--muted)]">
          Ce que tous tes agents savent. Chaque souvenir est versionné : réécrire ne détruit rien.
        </p>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Panel title="Recherche">
            <div className="flex flex-wrap gap-2 p-3">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un fait, une décision, un piège…"
                aria-label="Rechercher dans la mémoire"
                className="min-w-[200px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-dim)]"
              />
              <select
                value={kind}
                onChange={(event) => setKind(event.target.value as MemoryKind | "")}
                aria-label="Filtrer par nature"
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-dim)]"
              >
                <option value="">toutes natures</option>
                {MEMORY_KINDS.map((value) => (
                  <option key={value} value={value}>
                    {KIND_LABEL[value]}
                  </option>
                ))}
              </select>
              <input
                value={scope}
                onChange={(event) => setScope(event.target.value)}
                placeholder="portée (ex. project:jarvis)"
                aria-label="Filtrer par portée"
                className="w-[190px] rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-dim)]"
              />
            </div>
          </Panel>

          <Panel title={`Souvenirs (${memory.data.entries.length})`}>
            {memory.data.entries.length ? (
              <ul className="max-h-[560px] overflow-y-auto">
                {memory.data.entries.map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(selected === entry.id ? null : entry.id)}
                      aria-pressed={selected === entry.id}
                      className={`block w-full cursor-pointer border-b border-[var(--border)] px-4 py-3 text-left transition hover:bg-[var(--bg-elevated)] ${
                        selected === entry.id ? "bg-[var(--bg-elevated)]" : ""
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Tag color={KIND_COLOR[entry.kind]}>{KIND_LABEL[entry.kind] ?? entry.kind}</Tag>
                        <span className="font-medium">{entry.title}</span>
                        {entry.pinned && <span title="épinglé">📌</span>}
                        {entry.supersededBy && <Tag color="var(--red)">dépassé</Tag>}
                      </div>
                      <p className="mt-1 line-clamp-3 text-sm text-[var(--muted)]">{entry.body}</p>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 font-mono text-[11px] text-[var(--muted)]">
                        <span>{entry.scope}</span>
                        <span>v{entry.version}</span>
                        <span>confiance {Math.round(entry.confidence * 100)}%</span>
                        <span>{relativeTime(entry.updatedAt, now)}</span>
                        {entry.tags.map((tag) => (
                          <span key={tag}>#{tag}</span>
                        ))}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Aucun souvenir ne correspond.</Empty>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <MemoryComposer onSaved={() => void memory.refresh()} />
          <Panel title="Historique">
            {detail.data.entry ? (
              <div className="space-y-3 p-4">
                <div>
                  <div className="font-medium">{detail.data.entry.title}</div>
                  <p className="mt-1 text-sm text-[var(--muted)]">{detail.data.entry.body}</p>
                </div>
                {detail.data.revisions.length ? (
                  <ol className="space-y-2 border-t border-[var(--border)] pt-3">
                    {detail.data.revisions.map((revision) => (
                      <li key={revision.id} className="text-sm">
                        <div className="font-mono text-[11px] text-[var(--muted)]">
                          v{revision.version} · {relativeTime(revision.changedAt, now)}
                          {revision.changeNote ? ` · ${revision.changeNote}` : ""}
                        </div>
                        <p className="text-[var(--muted)]">{revision.body}</p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="border-t border-[var(--border)] pt-3 text-sm text-[var(--muted)]">
                    Version initiale — aucune réécriture pour l&apos;instant.
                  </p>
                )}
              </div>
            ) : (
              <Empty>Sélectionne un souvenir pour voir comment il a évolué.</Empty>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

/** Saisie manuelle : la même route que celle utilisée par les agents. */
function MemoryComposer({ onSaved }: { onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<MemoryKind>("fact");
  const [scope, setScope] = useState("global");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch("/api/memory", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, body, kind, scope, source: "dashboard" }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);
      setStatus(payload.created ? "Souvenir créé." : `Souvenir mis à jour (v${payload.entry.version}).`);
      setTitle("");
      setBody("");
      onSaved();
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : "échec de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title="Apprendre quelque chose à Jarvis">
      <form onSubmit={submit} className="space-y-2 p-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          placeholder="Titre — ex. « Déploiement via Vercel uniquement »"
          aria-label="Titre du souvenir"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-dim)]"
        />
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          required
          rows={3}
          placeholder="Contenu — ce que tout agent doit savoir."
          aria-label="Contenu du souvenir"
          className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-dim)]"
        />
        <div className="flex flex-wrap gap-2">
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as MemoryKind)}
            aria-label="Nature du souvenir"
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-dim)]"
          >
            {MEMORY_KINDS.map((value) => (
              <option key={value} value={value}>
                {KIND_LABEL[value]}
              </option>
            ))}
          </select>
          <input
            value={scope}
            onChange={(event) => setScope(event.target.value)}
            aria-label="Portée du souvenir"
            className="w-[170px] rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-dim)]"
          />
          <button
            type="submit"
            disabled={saving}
            className="ml-auto cursor-pointer rounded-lg border border-[var(--accent-dim)] px-4 py-2 text-sm text-[var(--accent)] transition hover:bg-[var(--bg-elevated)] disabled:opacity-50"
          >
            {saving ? "…" : "Mémoriser"}
          </button>
        </div>
        {status && <p className="text-xs text-[var(--muted)]">{status}</p>}
      </form>
    </Panel>
  );
}
