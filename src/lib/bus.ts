import { EventEmitter } from "node:events";

/**
 * Bus en mémoire qui relie l'ingestion des hooks au flux SSE du dashboard.
 * Volontairement simple : la vérité durable reste SQLite, le bus ne sert qu'au live.
 */
type Listener = (payload: unknown) => void;

const globalRef = globalThis as typeof globalThis & {
  __jarvisBus?: EventEmitter;
};

function bus(): EventEmitter {
  if (!globalRef.__jarvisBus) {
    const emitter = new EventEmitter();
    // Un dashboard ouvert dans plusieurs onglets = plusieurs abonnés.
    emitter.setMaxListeners(100);
    globalRef.__jarvisBus = emitter;
  }
  return globalRef.__jarvisBus;
}

export function publish(topic: string, payload: unknown): void {
  bus().emit(topic, payload);
}

export function subscribe(topic: string, listener: Listener): () => void {
  bus().on(topic, listener);
  return () => bus().off(topic, listener);
}
