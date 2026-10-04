"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Deterministic torn-paper edge (top + bottom). */
function torn(seed: number) {
  let r = seed;
  const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  const n = 16, top: string[] = [], bottom: string[] = [];
  for (let i = 0; i <= n; i++) top.push(`${(i / n) * 100}% ${rnd() * 3.2}%`);
  for (let i = n; i >= 0; i--) bottom.push(`${(i / n) * 100}% ${100 - rnd() * 3.2}%`);
  return `polygon(${[...top, ...bottom].join(",")})`;
}

const PAGES = [
  { scrawl: ["Otieno ......... 250", "Wanjiku ........ 120", "Kamau .......... 480", "~~~ (imefutika) ~~~"], title: "Daftari linapotea", body: "Ukurasa mmoja ukichanika au ukinyeshewa, madeni ya wiki nzima yanaenda nayo." },
  { scrawl: ["“Nimetuma mama!”", "SMS ... SMS ... SMS", "250? au 205?", "foleni inasubiri"], title: "M-Pesa ya kukisia", body: "Unakagua SMS moja moja huku wateja wanasubiri. Pesa ikikosekana, hujui ni ya nani." },
  { scrawl: ["Mauzo: 12,400", "Soko: ????", "Gas + makaa: ??", "Faida = ¯\\_(ツ)_/¯"], title: "Faida ya leo? Sijui.", body: "Unajua uliuza kiasi gani. Hujui ulibaki na nini baada ya soko, gas, makaa na karo." },
  { scrawl: ["Pilau — imeisha 1:40", "Wateja 9 wamerudi", "Kesho: kiasi kile kile", "..."], title: "Pesa inabaki mezani", body: "Chakula kinaisha mapema, au kinabaki jioni. Kesho unapika kwa kukisia tena." },
];

export function ProblemStory() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const el = track.current!;
      const dist = () => Math.max(0, el.scrollWidth - window.innerWidth);
      gsap.to(el, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${dist()}`, pin: true, scrub: 0.6, invalidateOnRefresh: true } });
      gsap.from(".paper", { y: 60, rotate: (i) => (i % 2 ? 7 : -7), opacity: 0, stagger: 0.12, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: root.current, start: "top 70%" } });
    });
  }, { scope: root });

  return (
    <section ref={root} className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden py-16 motion-reduce:overflow-x-auto">
      <div className="mx-auto w-full max-w-6xl px-5">
        <p className="text-sm uppercase tracking-[0.2em] text-nyanya">Shida ya kila siku</p>
        <h2 className="mt-3 max-w-[18ch] font-display text-4xl font-semibold leading-tight lg:text-5xl">Biashara nzuri, hesabu kwa kichwa.</h2>
      </div>
      <div ref={track} className="mt-10 flex w-max gap-6 px-5 lg:px-[max(1.25rem,calc((100vw-72rem)/2+1.25rem))]">
        {PAGES.map((p, i) => (
          <article key={p.title} className="paper relative w-[78vw] max-w-[360px] shrink-0" style={{ transform: `rotate(${[-2, 1.5, -1, 2][i]}deg)` }}>
            <div className="bg-[#f3ead8] px-6 pt-8 pb-7 text-[#2b2420] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.8)]"
              style={{ clipPath: torn(i * 97 + 13), backgroundImage: "repeating-linear-gradient(transparent 0 27px, #c9d6dd 27px 28px)", backgroundPositionY: "18px" }}>
              <span className="absolute top-0 left-9 h-full w-px bg-[#e3a3a3]" />
              <ul className="pl-6 font-serif text-[17px] italic leading-[28px]">
                {p.scrawl.map((l) => <li key={l} className={l.includes("~~~") ? "text-[#2b2420]/30 line-through" : ""}>{l}</li>)}
              </ul>
            </div>
            <h3 className="mt-5 font-display text-2xl font-semibold">{p.title}</h3>
            <p className="mt-1.5 text-dim">{p.body}</p>
          </article>
        ))}
        <div className="flex w-[70vw] max-w-[320px] shrink-0 flex-col justify-center">
          <p className="font-display text-3xl font-semibold leading-tight">Kuna njia rahisi zaidi.</p>
          <p className="mt-2 flex items-center gap-2 text-flame">Endelea kushuka <ArrowRight className="size-5" /></p>
        </div>
      </div>
    </section>
  );
}