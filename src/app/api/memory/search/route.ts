import { recall } from "@/lib/memory";
import { fail, ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Recherche plein texte — c'est l'appel que font les agents avant d'agir. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");
  if (!query?.trim()) return fail("paramètre q requis");

  return ok({
    query,
    entries: recall({
      query,
      projectId: url.searchParams.get("projectId") ?? undefined,
      limit: Number(url.searchParams.get("limit") ?? 10),
    }),
  });
}
