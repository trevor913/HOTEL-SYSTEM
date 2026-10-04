"use client";
import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";

/** Two-note kitchen bell via WebAudio (no asset needed). */
function ding() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [880, 1318.5].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      const t0 = ctx.currentTime + i * 0.16;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6);
      o.connect(g).connect(ctx.destination); o.start(t0); o.stop(t0 + 0.65);
    });
    setTimeout(() => void ctx.close(), 1200);
  } catch { /* audio blocked */ }
}

/**
 * New-order ding + toast + browser notification (§8.7). Also syncs the on-device store across
 * tabs, so an order placed on the public menu in another tab rings the kitchen tab.
 */
export function OrderAlerts() {
  const t = useT();
  const toast = useToast((x) => x.show);
  const ids = useApp((s) => s.orders.filter((o) => o.status === "new").map((o) => o.id).join(","));
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === useApp.persist.getOptions().name) void useApp.persist.rehydrate(); };
    window.addEventListener("storage", onStorage);
    if ("Notification" in window && Notification.permission === "default") void Notification.requestPermission().catch(() => {});
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const cur = ids ? ids.split(",") : [];
    if (!seen.current) { seen.current = new Set(cur); return; }
    const fresh = cur.filter((id) => !seen.current!.has(id));
    cur.forEach((id) => seen.current!.add(id));
    if (!fresh.length) return;
    const o = useApp.getState().orders.find((x) => x.id === fresh[0]);
    if (!o) return;
    ding();
    if ("vibrate" in navigator) navigator.vibrate([60, 40, 60]);
    toast(`🔔 ${t.pub.newOrder} ${o.code}: ${o.customerName}`);
    if ("Notification" in window && Notification.permission === "granted" && document.visibilityState === "hidden") {
      try { new Notification(`${t.pub.newOrder} ${o.code}`, { body: o.customerName, icon: "/icon.svg", tag: o.id }); } catch { /* unsupported */ }
    }
  }, [ids, t, toast]);

  return null;
}