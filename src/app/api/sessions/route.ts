import { listSessions } from "@/lib/events";
import { ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return ok({
    sessions: listSessions({
      limit: Number(url.searchParams.get("limit") ?? 50),
      projectId: url.searchParams.get("projectId") ?? undefined,
    }),
  });
}
