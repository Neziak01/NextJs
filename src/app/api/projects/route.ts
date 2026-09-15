import { listProjects, upsertProject, type ProjectInput } from "@/lib/projects";
import { authorize, fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return ok({ projects: listProjects() });
}

export async function POST(request: Request) {
  if (!authorize(request)) return fail("non autorisé", 401);
  const body = await readJson<ProjectInput>(request);
  if (!body?.id?.trim()) return fail("id de projet requis");
  return ok({ project: upsertProject({ ...body, id: body.id.trim() }) }, { status: 201 });
}
