"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

const Scene = dynamic(() => import("./HeroScene"), { ssr: false, loading: () => null });

function webglOk() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}

/**
 * Hero background. Static photo always renders first (fast LCP); the 3D scene is
 * dynamically imported and faded in. Reduced-motion / no-WebGL keep the photo.
 */
export function Hero3D() {
  const [mode, setMode] = useState<"static" | "lite" | "full">("static");
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (reduced || saveData || !webglOk()) return;
    const small = window.matchMedia("(max-width: 768px)").matches;
    const weak = (navigator.hardwareConcurrency ?? 8) <= 4;
    const id = window.setTimeout(() => setMode(small || weak ? "lite" : "full"), 350);
    const t2 = window.setTimeout(() => setReady(true), 1300);
    return () => { clearTimeout(id); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (!root.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting), { threshold: 0 });
    io.observe(root.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={root} className="absolute inset-0 -z-10" aria-hidden>
      <Image src="/img/kibanda.jpg" alt="" fill priority sizes="100vw" className={cn("object-cover opacity-45 transition-opacity duration-1000", ready && "opacity-0")} />
      {mode !== "static" && (
        <div className={cn("absolute inset-0 transition-opacity duration-1000", ready ? "opacity-100" : "opacity-0")}>
          <Scene lite={mode === "lite"} active={visible} />
        </div>
      )}
    </div>
  );
}