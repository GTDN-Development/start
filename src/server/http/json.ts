import { NextResponse } from "next/server";
import { z } from "zod";

export function jsonOk(status: number): NextResponse;

export function jsonOk<T extends Record<string, unknown>>(body: T, status?: number): NextResponse;

export function jsonOk<T extends Record<string, unknown>>(bodyOrStatus?: T | number, status = 200) {
  if (typeof bodyOrStatus === "number") {
    return NextResponse.json({ ok: true }, { status: bodyOrStatus });
  }

  return NextResponse.json({ ok: true, ...(bodyOrStatus ?? {}) }, { status });
}

export function jsonError(errorCode: string, status: number) {
  return NextResponse.json({ ok: false, errorCode }, { status });
}

export async function parseJsonBody<T>(request: Request, schema: z.ZodType<T>): Promise<T | null> {
  try {
    const data = (await request.json()) as unknown;
    const parsed = schema.safeParse(data);

    if (!parsed.success) {
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}
