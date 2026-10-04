"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Delete } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "@/components/brand/Logo";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { cn } from "@/lib/utils/cn";

/** Full-screen staff PIN lock (§8.6). Auto-locks after 5 min in the background. */
export function PinLock() {
  const t = useT();
  const locked = useApp((s) => s.locked);
  const pinLock = useApp((s) => s.pinLock);
  const staff = useApp((s) => s.staff);
  const unlock = useApp((s) => s.unlock);
  const [who, setWho] = useState(staff[0]?.id ?? "");
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(0);

  useEffect(() => {
    if (!pinLock) return;
    let hiddenAt = 0;
    const onVis = () => {
      if (document.visibilityState === "hidden") hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > 5 * 60_000) useApp.getState().lock();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [pinLock]);

  const press = (k: string) => {
    if ("vibrate" in navigator) navigator.vibrate(8);
    if (k === "del") return setPin((p) => p.slice(0, -1));
    const next = (pin + k).slice(0, 4);
    setPin(next);
    if (next.length === 4) {
      setTimeout(() => {
        if (!unlock(who, next)) { setShake((x) => x + 1); if ("vibrate" in navigator) navigator.vibrate([30, 40, 30]); }
        setPin("");
      }, 120);
    }
  };

  return (
    <AnimatePresence>
      {locked && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.04 }} className="fixed inset-0 z-[100] flex flex-col items-center overflow-y-auto bg-bg px-6 pt-[max(env(safe-area-inset-top),32px)] pb-6" role="dialog" aria-modal aria-label={t.ops.enterPin}>
          <Logo />
          <p className="mt-6 text-sm text-dim">{t.ops.whoAreYou}</p>
          <div className="mt-3 flex gap-3">
            {staff.map((st) => (
              <button key={st.id} onClick={() => { setWho(st.id); setPin(""); }} className={cn("flex flex-col items-center gap-1 rounded-2xl p-2", who === st.id && "bg-raised ring-1 ring-flame")}>
                <Avatar name={st.name} size={52} /><span className="text-xs">{st.name.split(" ")[0]}</span>
              </button>
            ))}
          </div>
          <motion.div key={shake} animate={shake ? { x: [0, -12, 12, -8, 8, 0] } : {}} transition={{ duration: 0.35 }} className="mt-8 flex gap-4" aria-live="polite">
            {[0, 1, 2, 3].map((i) => <span key={i} className={cn("size-4 rounded-full border-2", i < pin.length ? "border-flame bg-flame" : "border-line")} />)}
          </motion.div>
          <p className={cn("mt-3 h-5 text-sm", shake ? "text-nyanya" : "text-dim")}>{shake ? t.ops.wrongPin : t.ops.enterPin}</p>
          <div className="mt-auto grid w-full max-w-xs grid-cols-3 gap-3 pt-6">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map((k, i) => k === "" ? <span key={i} /> : (
              <motion.button key={k} whileTap={{ scale: 0.9 }} onClick={() => press(k)} aria-label={k === "del" ? "Delete" : k} className="h-[72px] rounded-full bg-raised font-display text-3xl">
                {k === "del" ? <Delete className="mx-auto size-6 text-dim" /> : k}
              </motion.button>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-dim">{t.ops.demoPins}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}