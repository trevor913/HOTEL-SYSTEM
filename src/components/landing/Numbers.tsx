"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const STATS = [
  { n: 2, pre: "", suf: " dak", label: "Kutoka sifuri hadi mauzo ya kwanza" },
  { n: 18, pre: "", suf: "", label: "Kazi Msaidizi anaweza kufanya" },
  { n: 5000, pre: "KSh ", suf: "+", label: "Hapo Msaidizi anauliza kwanza kabla ya kuandika" },
  { n: 0, pre: "KSh ", suf: "", label: "Kuanza. Hakuna kadi, hakuna mkataba." },
];

/** Numbers strip (§9.8 scene 5): counters roll up when scrolled into view. */
export function Numbers() {
  const root = useRef<HTMLElement>(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const to = Number(el.dataset.count), o = { v: 0 };
        el.textContent = "0";
        gsap.to(o, { v: to, duration: 1.6, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 88%", once: true }, onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString("en-KE"); } });
      });
    });
  }, { scope: root });
  return (
    <section ref={root} className="border-y border-line bg-raised">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-line lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="bg-raised px-5 py-8">
            <p className="money font-display text-4xl font-semibold text-flame lg:text-5xl">{s.pre}<span data-count={s.n}>{s.n.toLocaleString("en-KE")}</span>{s.suf}</p>
            <p className="mt-2 text-sm text-dim">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}