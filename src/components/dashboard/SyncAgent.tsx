"use client";
import { useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { syncQueue } from "@/lib/sync/queue";

/** Mirrors the IndexedDB queue length into the store (offline chip) and flushes on reconnect. */
export function SyncAgent() {
  const t = useT();
  const toast = useToast((x) => x.show);
  useEffect(() => {
    let soon: ReturnType<typeof setTimeout> | undefined;
    // Online: flush shortly after each new op so the pending chip only lingers while truly offline.
    const unsub = syncQueue.subscribe((n) => {
      useApp.setState({ pendingSync: n });
      if (n > 0 && navigator.onLine) { clearTimeout(soon); soon = setTimeout(() => void flush(), 1200); }
    });
    void syncQueue.refresh();
    let wasOffline = !navigator.onLine;
    const flush = async () => {
      if (!navigator.onLine) { wasOffline = true; return; }
      const n = await syncQueue.flush();
      if (n > 0 && wasOffline) toast(`${n} ${t.common.synced} ✓`);
      wasOffline = false;
    };
    void flush();
    const onOffline = () => { wasOffline = true; };
    const onVis = () => { if (document.visibilityState === "visible") void flush(); };
    window.addEventListener("online", flush);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVis);
    const id = setInterval(flush, 30_000);
    return () => { unsub(); clearTimeout(soon); clearInterval(id); window.removeEventListener("online", flush); window.removeEventListener("offline", onOffline); document.removeEventListener("visibilitychange", onVis); };
  }, [t, toast]);
  return null;
}