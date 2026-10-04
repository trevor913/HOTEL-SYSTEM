"use client";
import { MotionConfig } from "motion/react";

/** Respect the OS "reduce motion" setting across every motion component (§9.5). */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}