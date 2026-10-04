import { describe, expect, it } from "vitest";
import { createQueue, type KV, type SyncOp } from "@/lib/sync/queue";

const memKV = (): KV => { const m = new Map<string, unknown>(); return { get: async (k) => m.get(k), set: async (k, v) => { m.set(k, v); } }; };

describe("§11 offline sync queue", () => {
  it("queues while offline and flushes on reconnect", async () => {
    let online = false;
    const sent: SyncOp[] = [];
    const q = createQueue(memKV(), async (ops) => { if (!online) throw new Error("offline"); sent.push(...ops); return ops.map((o) => o.id); });
    const counts: number[] = [];
    q.subscribe((n) => counts.push(n));
    await Promise.all([q.enqueue("sale", { a: 1 }), q.enqueue("debt", { b: 2 })]);
    expect(await q.count()).toBe(2);
    expect(await q.flush()).toBe(0);
    expect(await q.count()).toBe(2);
    online = true;
    expect(await q.flush()).toBe(2);
    expect(await q.count()).toBe(0);
    expect(sent.map((o) => o.kind)).toEqual(["sale", "debt"]);
    expect(counts.at(-1)).toBe(0);
  });
  it("keeps unacknowledged ops and batches", async () => {
    const q = createQueue(memKV(), async (ops) => ops.slice(0, 1).map((o) => o.id), 2);
    for (let i = 0; i < 3; i++) await q.enqueue("expense", i, `e${i}`);
    expect(await q.flush()).toBe(3);
    expect(await q.count()).toBe(0);
  });
  it("ops enqueued during a flush are not lost", async () => {
    let q!: ReturnType<typeof createQueue>;
    q = createQueue(memKV(), async (ops) => { if (ops[0]?.id === "x1") await q.enqueue("sale", 2, "x2"); return ops.map((o) => o.id); });
    await q.enqueue("sale", 1, "x1");
    await q.flush();
    expect(await q.count()).toBeLessThanOrEqual(1);
    await q.flush();
    expect(await q.count()).toBe(0);
  });
});