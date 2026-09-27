import type { Transition, Variants } from "motion/react";

/** Signature "steam" easing (§9.5) */
export const steam = [0.22, 1, 0.36, 1] as const;
export const t = (duration = 0.45, delay = 0): Transition => ({ duration, delay, ease: steam });
export const spring: Transition = { type: "spring", stiffness: 420, damping: 32 };

export const page: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: t(0.45) },
  exit: { opacity: 0, y: -6, transition: t(0.25) },
};
export const list: Variants = { animate: { transition: { staggerChildren: 0.04 } } };
export const item: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: t(0.4) },
};
