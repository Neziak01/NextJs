import { overview } from "@/lib/stats";
import { ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return ok(overview());
}
