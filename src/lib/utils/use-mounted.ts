"use client";
import { useEffect, useState } from "react";

/** True after the first client render — gate UI that reads the on-device (localStorage) store. */
export function useMounted(): boolean {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}