/** Helpers d'affichage partagés serveur/client — volontairement sans dépendance. */

export function relativeTime(ts: number | null | undefined, now: number): string {
  // now === 0 : rendu serveur, l'horloge client n'a pas encore démarré.
  if (!ts || !now) return "—";
  const delta = Math.max(0, now - ts);
  const s = Math.round(delta / 1000);
  if (s < 10) return "à l'instant";
  if (s < 60) return `il y a ${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  return `il y a ${d} j`;
}

export function clock(ts: number): string {
  return new Date(ts).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function duration(from: number, to: number): string {
  if (!to) return "—";
  const s = Math.max(0, Math.round((to - from) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

/** Ne garde que le dernier segment d'un chemin : les colonnes restent lisibles. */
export function shortPath(path: string | null): string {
  if (!path) return "—";
  const parts = path.split("/").filter(Boolean);
  return parts.length <= 2 ? path : `…/${parts.slice(-2).join("/")}`;
}

export const STATUS_LABEL: Record<string, string> = {
  running: "en cours",
  waiting: "en attente",
  idle: "au repos",
  done: "terminé",
  error: "erreur",
};

export const STATUS_COLOR: Record<string, string> = {
  running: "var(--green)",
  waiting: "var(--amber)",
  idle: "var(--muted)",
  done: "var(--accent-dim)",
  error: "var(--red)",
};

export const KIND_LABEL: Record<string, string> = {
  fact: "Fait",
  decision: "Décision",
  preference: "Préférence",
  pattern: "Pattern",
  glossary: "Glossaire",
  person: "Personne",
  pitfall: "Piège",
};

export const KIND_COLOR: Record<string, string> = {
  fact: "var(--accent)",
  decision: "var(--violet)",
  preference: "var(--amber)",
  pattern: "var(--green)",
  glossary: "var(--muted)",
  person: "var(--accent-dim)",
  pitfall: "var(--red)",
};
