import { contextPack } from "@/lib/memory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Brief mémoire prêt à coller en tête de contexte d'un agent.
 * Renvoie du markdown brut : `curl .../api/memory/context?projectId=x` suffit à amorcer un agent.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const markdown = contextPack({
    projectId: url.searchParams.get("projectId"),
    query: url.searchParams.get("q") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 25),
  });

  return new Response(markdown, {
    headers: { "content-type": "text/markdown; charset=utf-8", "cache-control": "no-store" },
  });
}
