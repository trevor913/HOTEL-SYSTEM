"use client";
import { AnimatePresence, motion } from "motion/react";
import { create } from "zustand";
import { CheckCircle2, AlertTriangle } from "lucide-react";

interface ToastState { msg: string | null; tone: "ok" | "warn"; show: (msg: string, tone?: "ok" | "warn") => void }
export const useToast = create<ToastState>((set) => ({
  msg: null, tone: "ok",
  show: (msg, tone = "ok") => { set({ msg, tone }); setTimeout(() => set((s) => (s.msg === msg ? { msg: null } : s)), 2400); },
}));

export function Toaster() {
  const { msg, tone } = useToast();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center pt-safe">
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 8, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
            className="flex items-center gap-2 rounded-full border border-line bg-overlay px-4 py-2.5 text-sm font-medium shadow-2xl" role="status">
            {tone === "ok" ? <CheckCircle2 className="size-4 text-sukuma" /> : <AlertTriangle className="size-4 text-nyanya" />}
            {msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
