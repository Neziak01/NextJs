"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/* ------------------------------------------------------------------ horloge */

/**
 * Horloge partagée exposée comme une source externe.
 *
 * Les durées (« il y a 12 s ») doivent se rafraîchir seules, mais `Date.now()` lu
 * pendant le rendu rendrait les composants impurs et casserait l'hydratation.
 * On passe donc par `useSyncExternalStore` : une seule minuterie pour toute la page,
 * et un instantané stable côté serveur (0 = « heure inconnue »).
 */
let currentNow = 0;
let ticker: ReturnType<typeof setInterval> | null = null;
const clockListeners = new Set<() => void>();

function subscribeClock(listener: () => void): () => void {
  clockListeners.add(listener);
  if (!ticker) {
    currentNow = Date.now();
    ticker = setInterval(() => {
      currentNow = Date.now();
      for (const notify of clockListeners) notify();
    }, 1000);
  }
  return () => {
    clockListeners.delete(listener);
    if (!clockListeners.size && ticker) {
      clearInterval(ticker);
      ticker = null;
    }
  };
}

/** Horodatage courant, ou 0 tant que le composant n'est pas monté côté client. */
export function useNow(): number {
  return useSyncExternalStore(
    subscribeClock,
    () => currentNow,
    () => 0,
  );
}

/* --------------------------------------------------------------------- flux */

/**
 * Abonnement au flux SSE de Jarvis.
 *
 * Les événements arrivent par rafales (un agent qui enchaîne des outils) : on ne
 * refetch pas à chaque message, on programme un rafraîchissement groupé.
 */
export function useLiveRefresh(refresh: () => void, { debounceMs = 400 } = {}) {
  const [connected, setConnected] = useState(false);
  const [lastEventAt, setLastEventAt] = useState<number | null>(null);
  const refreshRef = useRef(refresh);

  // Mis à jour après rendu : le flux appelle toujours la dernière version du callback.
  useEffect(() => {
    refreshRef.current = refresh;
  });

  useEffect(() => {
    const source = new EventSource("/api/stream");
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      setLastEventAt(Date.now());
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => refreshRef.current(), debounceMs);
    };

    source.addEventListener("hello", () => setConnected(true));
    source.addEventListener("agent-event", schedule);
    source.addEventListener("memory", schedule);
    source.onerror = () => setConnected(false);

    return () => {
      if (timer) clearTimeout(timer);
      source.close();
    };
  }, [debounceMs]);

  return { connected, lastEventAt };
}

/* -------------------------------------------------------------------- fetch */

/** Petit fetch JSON typé, qui remonte l'état de chargement sans bibliothèque externe. */
export function useJson<T>(url: string, initial: T) {
  const [state, setState] = useState<{ data: T; loading: boolean; error: string | null }>({
    data: initial,
    loading: true,
    error: null,
  });

  const refresh = useCallback(
    () =>
      fetch(url, { cache: "no-store" })
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json() as Promise<T>;
        })
        .then((data) => setState({ data, loading: false, error: null }))
        .catch((cause: unknown) =>
          setState((previous) => ({
            data: previous.data,
            loading: false,
            error: cause instanceof Error ? cause.message : "erreur inconnue",
          })),
        ),
    [url],
  );

  useEffect(() => {
    // Premier chargement : la mise à jour d'état arrive après la promesse, jamais pendant l'effet.
    const promise = refresh();
    return () => void promise;
  }, [refresh]);

  return { ...state, refresh };
}
