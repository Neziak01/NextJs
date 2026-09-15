import { subscribe } from "@/lib/bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Flux SSE : le dashboard reçoit les événements agents et mémoire sans polling. */
export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const send = (type: string, payload: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`));
        } catch {
          closed = true;
        }
      };

      send("hello", { at: Date.now() });

      const offEvent = subscribe("event", (payload) => send("agent-event", payload));
      const offMemory = subscribe("memory", (payload) => send("memory", payload));
      // Sans trafic, certains proxys coupent la connexion : un ping régulier la garde ouverte.
      const ping = setInterval(() => send("ping", { at: Date.now() }), 20_000);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(ping);
        offEvent();
        offMemory();
        try {
          controller.close();
        } catch {
          /* déjà fermé côté client */
        }
      };

      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
