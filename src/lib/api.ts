import { NextResponse } from "next/server";

/** Toutes les routes touchent SQLite : jamais d'edge runtime, jamais de cache. */
export const nodeRoute = { runtime: "nodejs" as const, dynamic: "force-dynamic" as const };

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Jarvis écoute des hooks locaux. Si `JARVIS_TOKEN` est défini, on exige le bearer
 * correspondant sur les routes d'écriture ; sinon on reste ouvert pour l'usage localhost.
 */
export function authorize(request: Request): boolean {
  const expected = process.env.JARVIS_TOKEN;
  if (!expected) return true;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${expected}`;
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
