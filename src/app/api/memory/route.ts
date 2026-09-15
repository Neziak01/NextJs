import { isMemoryKind, recall, remember } from "@/lib/memory";
import { authorize, fail, ok, readJson } from "@/lib/api";
import type { MemoryKind } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lecture de la mémoire commune, filtrée par portée / nature / recherche. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  if (kind && !isMemoryKind(kind)) return fail(`nature de souvenir inconnue : ${kind}`);

  return ok({
    entries: recall({
      query: url.searchParams.get("q") ?? undefined,
      projectId: url.searchParams.get("projectId") ?? undefined,
      scope: url.searchParams.get("scope") ?? undefined,
      kind: (kind as MemoryKind) ?? undefined,
      limit: Number(url.searchParams.get("limit") ?? 50),
      includeSuperseded: url.searchParams.get("includeSuperseded") === "true",
    }),
  });
}

/** Écriture d'un souvenir. Même titre + même portée = nouvelle version, pas un doublon. */
export async function POST(request: Request) {
  if (!authorize(request)) return fail("non autorisé", 401);

  const body = await readJson<{
    title?: string;
    body?: string;
    kind?: string;
    scope?: string;
    tags?: string[];
    source?: string;
    confidence?: number;
    pinned?: boolean;
    changeNote?: string;
  }>(request);

  if (!body?.title?.trim()) return fail("titre requis");
  if (!body?.body?.trim()) return fail("contenu requis");
  if (body.kind && !isMemoryKind(body.kind)) return fail(`nature de souvenir inconnue : ${body.kind}`);

  const result = remember({
    title: body.title,
    body: body.body,
    kind: body.kind as MemoryKind | undefined,
    scope: body.scope,
    tags: body.tags,
    source: body.source ?? null,
    confidence: body.confidence,
    pinned: body.pinned,
    changeNote: body.changeNote ?? null,
  });

  return ok(result, { status: result.created ? 201 : 200 });
}
