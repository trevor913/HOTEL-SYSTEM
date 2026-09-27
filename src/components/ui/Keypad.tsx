"use client";
import { motion } from "motion/react";
import { Delete } from "lucide-react";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "del"] as const;

/** Big, satisfying amount keypad (§8.2). Value is whole KES as a digit string. */
export function Keypad({ value, onChange, max = 9_999_999 }: { value: string; onChange: (v: string) => void; max?: number }) {
  const press = (k: (typeof KEYS)[number]) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(8);
    if (k === "del") return onChange(value.slice(0, -1));
    const next = (value === "0" ? "" : value) + k;
    if (Number(next) > max) return;
    onChange(next.replace(/^0+(?=\d)/, ""));
  };
  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Keypad">
      {KEYS.map((k) => (
        <motion.button
          key={k} type="button" onClick={() => press(k)} whileTap={{ scale: 0.92 }}
          className="relative h-16 overflow-hidden rounded-2xl bg-overlay font-display text-2xl font-medium text-ink active:bg-line"
          aria-label={k === "del" ? "Delete" : k}
        >
          {k === "del" ? <Delete className="mx-auto size-6 text-dim" /> : k}
        </motion.button>
      ))}
    </div>
  );
}

export function AmountDisplay({ value, tone = "ink" }: { value: string; tone?: "ink" | "sukuma" | "nyanya" }) {
  const n = Number(value || "0");
  const color = tone === "sukuma" ? "text-sukuma" : tone === "nyanya" ? "text-nyanya" : "text-ink";
  return (
    <div className="flex items-baseline justify-center gap-2 py-4">
      <span className="text-lg text-dim">KSh</span>
      <motion.span key={value} initial={{ y: 6, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} className={`money font-display text-6xl font-semibold ${color}`}>
        {n.toLocaleString("en-KE")}
      </motion.span>
    </div>
  );
}
