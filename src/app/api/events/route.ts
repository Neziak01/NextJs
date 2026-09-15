import { ingest, listEvents } from "@/lib/events";
import { authorize, fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Point d'entrée des hooks Claude Code. Accepte un événement ou un lot. */
export async function POST(request: Request) {
  if (!authorize(request)) return fail("non autorisé", 401);

  const body = await readJson<Record<string, unknown> | Record<string, unknown>[]>(request);
  if (!body) return fail("corps JSON invalide");

  const batch = Array.isArray(body) ? body : [body];
  if (!batch.length) return fail("lot vide");
  if (batch.length > 200) return fail("lot trop grand (200 max)");

  const accepted = [];
  for (const raw of batch) {
    if (typeof raw?.eventType !== "string") return fail("eventType manquant");
    accepted.push(ingest(raw as Parameters<typeof ingest>[0]));
  }
  return ok({ accepted: accepted.length, events: accepted }, { status: 201 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  return ok({
    events: listEvents({
      limit: Number(url.searchParams.get("limit") ?? 100),
      sessionId: url.searchParams.get("sessionId") ?? undefined,
      projectId: url.searchParams.get("projectId") ?? undefined,
      since: url.searchParams.get("since") ? Number(url.searchParams.get("since")) : undefined,
    }),
  });
}
