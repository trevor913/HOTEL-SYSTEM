/**
 * Offline sync queue (§11). Every money mutation (sale, debt, payment, expense) is appended
 * to an IndexedDB queue and flushed to /api/sync when online. The server upserts by op id,
 * so retries are safe. Storage and transport are injectable for tests.
 */
import { get as idbGet, set as idbSet } from "idb-keyval";

export type SyncKind = "sale" | "debt" | "payment" | "expense";
export interface SyncOp { id: string; kind: SyncKind; payload: unknown; at: string }
export interface KV { get(k: string): Promise<unknown>; set(k: string, v: unknown): Promise<void> }
export type Sender = (ops: SyncOp[]) => Promise<string[]>;

const KEY = "hotel-system:sync-queue";
const idbKV: KV = { get: (k) => idbGet(k), set: (k, v) => idbSet(k, v) };

export const httpSender: Sender = async (ops) => {
  const r = await fetch("/api/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ops }) });
  if (!r.ok) throw new Error(`sync ${r.status}`);
  const j = (await r.json()) as { accepted?: string[] };
  return j.accepted ?? [];
};

export function createQueue(kv: KV = idbKV, send: Sender = httpSender, batch = 50) {
  let chain: Promise<unknown> = Promise.resolve();
  const listeners = new Set<(n: number) => void>();
  let flushing = false;
  // Serialize all reads/writes so concurrent enqueue + flush never lose ops.
  const locked = <T>(fn: () => Promise<T>): Promise<T> => { const p = chain.then(fn, fn); chain = p.catch(() => {}); return p; };
  const read = async () => ((await kv.get(KEY)) as SyncOp[] | undefined) ?? [];
  const emit = (n: number) => listeners.forEach((l) => l(n));

  return {
    enqueue(kind: SyncKind, payload: unknown, id = `${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`) {
      return locked(async () => {
        const q = await read();
        q.push({ id, kind, payload, at: new Date().toISOString() });
        await kv.set(KEY, q); emit(q.length);
        return q.length;
      });
    },
    count: () => locked(async () => (await read()).length),
    refresh() { return locked(async () => { const n = (await read()).length; emit(n); return n; }); },
    subscribe(fn: (n: number) => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
    /** Sends queued ops in batches; returns how many were acknowledged. Leaves the rest on failure. */
    async flush(): Promise<number> {
      if (flushing) return 0;
      flushing = true;
      let done = 0;
      try {
        for (;;) {
          const ops = (await locked(read)).slice(0, batch);
          if (!ops.length) break;
          let acked: string[];
          try { acked = await send(ops); } catch { break; }
          if (!acked.length) break;
          const set = new Set(acked);
          const left = await locked(async () => { const q = (await read()).filter((o) => !set.has(o.id)); await kv.set(KEY, q); emit(q.length); return q.length; });
          done += acked.length;
          if (!left) break;
        }
      } finally { flushing = false; }
      return done;
    },
  };
}

export const syncQueue = createQueue();