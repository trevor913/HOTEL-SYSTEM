"use client";
import { useApp } from "../store/app-store";
import { sw } from "./sw";
import { en } from "./en";

type Widen<T> = T extends string ? string : T extends readonly (infer U)[] ? readonly Widen<U>[] : { [K in keyof T]: Widen<T[K]> };
export type Dict = Widen<typeof sw>;

const dicts: Record<"sw" | "en", Dict> = { sw, en };

/** Typed dictionary hook. Swahili is the default language (§9.6). */
export function useT(): Dict {
  const lang = useApp((s) => s.lang);
  return dicts[lang];
}
export function useLang() {
  return useApp((s) => s.lang);
}
