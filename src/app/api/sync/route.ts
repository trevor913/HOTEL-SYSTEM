import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/db/server";

export const dynamic = "force-dynamic";

const Body = z.object({
  ops: z.array(z.object({ id: z.string().min(1).max(80), kind: z.enum(["sale", "debt", "payment", "expense"]), payload: z.unknown(), at: z.string() })).max(200),
});

/**
 * Offline queue sink (§11). Mock mode: acknowledges (data already lives on-device).
 * Live mode: upserts into `sync_ops` by op id (idempotent), see drizzle/0002_sync_ops.sql.
 */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  const { ops } = parsed.data;
  const db = adminDb();
  if (!db) return NextResponse.json({ ok: true, mode: "mock", accepted: ops.map((o) => o.id), persisted: false });
  const { error } = await db.from("sync_ops").upsert(ops.map((o) => ({ id: o.id, kind: o.kind, payload: o.payload, client_at: o.at })), { onConflict: "id", ignoreDuplicates: true });
  if (error) return NextResponse.json({ ok: false, error: "persist failed" }, { status: 502 });
  return NextResponse.json({ ok: true, mode: "live", accepted: ops.map((o) => o.id), persisted: true });
}