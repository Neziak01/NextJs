import { forget, getMemory, remember, revisions, supersede } from "@/lib/memory";
import { authorize, fail, ok, readJson } from "@/lib/api";
import type { MemoryKind } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Un souvenir et tout son historique de versions. */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const entry = getMemory(id);
  if (!entry) return fail("souvenir introuvable", 404);
  return ok({ entry, revisions: revisions(id) });
}

/** Fait évoluer un souvenir existant (nouvelle version) ou le marque comme dépassé. */
export async function PATCH(request: Request, { params }: Params) {
  if (!authorize(request)) return fail("non autorisé", 401);
  const { id } = await params;
  const entry = getMemory(id);
  if (!entry) return fail("souvenir introuvable", 404);

  const body = await readJson<{
    body?: string;
    kind?: MemoryKind;
    tags?: string[];
    confidence?: number;
    pinned?: boolean;
    changeNote?: string;
    supersededBy?: string | null;
  }>(request);
  if (!body) return fail("corps JSON invalide");

  if (body.supersededBy !== undefined) {
    return ok({ entry: supersede(id, body.supersededBy) });
  }

  const result = remember({
    title: entry.title,
    scope: entry.scope,
    body: body.body ?? entry.body,
    kind: body.kind ?? entry.kind,
    tags: body.tags ?? entry.tags,
    confidence: body.confidence,
    pinned: body.pinned,
    source: entry.source,
    changeNote: body.changeNote ?? null,
  });
  return ok(result);
}

export async function DELETE(request: Request, { params }: Params) {
  if (!authorize(request)) return fail("non autorisé", 401);
  const { id } = await params;
  return forget(id) ? ok({ deleted: true }) : fail("souvenir introuvable", 404);
}
