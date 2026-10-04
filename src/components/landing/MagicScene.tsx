"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { Bot, Mic } from "lucide-react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const MSG = "Nimeuza chai tatu na chapati mbili cash";
const STEPS = [
  { n: "01", t: "Ongea kama kawaida", b: "Kwa Kiswahili, Sheng au English. Andika au shika mic." },
  { n: "02", t: "Msaidizi anaelewa", b: "“tatu”, “mbili”, “cash”: bidhaa, idadi na njia ya malipo." },
  { n: "03", t: "Imeandikwa", b: "Risiti, faida ya leo na stock vinasasishwa papo hapo." },
];

/** Pinned phone: the chat types itself, then the receipt card lands (§9.8 scene 3). */
export function MagicScene() {
  const root = useRef<HTMLElement>(null);
  const typed = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const el = typed.current!;
      el.textContent = "";
      const o = { n: 0 };
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "+=1800", pin: true, scrub: 0.5 } });
      tl.set(".m-step", { opacity: 0.3 }).set(".m-step-0", { opacity: 1 })
        .fromTo(".m-user", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4 })
        .to(o, { n: MSG.length, duration: 3, ease: "none", onUpdate: () => { el.textContent = MSG.slice(0, Math.round(o.n)); } })
        .to(".m-step-0", { opacity: 0.3, duration: 0.2 }).to(".m-step-1", { opacity: 1, duration: 0.2 }, "<")
        .fromTo(".m-typing", { opacity: 0 }, { opacity: 1, duration: 0.3 })
        .to(".m-typing", { opacity: 0, duration: 0.3 }, "+=0.8")
        .to(".m-step-1", { opacity: 0.3, duration: 0.2 }).to(".m-step-2", { opacity: 1, duration: 0.2 }, "<")
        .fromTo(".m-receipt", { y: 50, opacity: 0, scale: 0.92 }, { y: 0, opacity: 1, scale: 1, duration: 1, ease: "back.out(1.6)" })
        .fromTo(".m-stamp", { scale: 2.2, opacity: 0, rotate: -24 }, { scale: 1, opacity: 1, rotate: -9, duration: 0.5, ease: "power4.in" })
        .fromTo(".m-profit", { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.5 });
    });
  }, { scope: root });

  return (
    <section ref={root} className="relative flex min-h-[100svh] items-center overflow-hidden py-16">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-flame">Msaidizi</p>
          <h2 className="mt-3 max-w-[16ch] font-display text-4xl font-semibold leading-tight lg:text-5xl">Sema tu. Imeandikwa.</h2>
          <ol className="mt-8 hidden space-y-5 lg:block">
            {STEPS.map((s, i) => (
              <li key={s.n} className={`m-step m-step-${i} flex gap-4`}>
                <span className="money font-display text-lg text-flame">{s.n}</span>
                <span><span className="block font-display text-xl font-semibold">{s.t}</span><span className="text-dim">{s.b}</span></span>
              </li>
            ))}
          </ol>
        </div>

        <div className="relative mx-auto h-[min(560px,72svh)] w-[min(280px,72vw)] rounded-[42px] border-[7px] border-[#2a2522] bg-bg p-3 shadow-[0_40px_80px_-30px_rgba(255,107,44,0.35)]">
          <span className="absolute top-2 left-1/2 h-1.5 w-16 -translate-x-1/2 rounded-full bg-[#2a2522]" />
          <div className="m-profit absolute inset-x-3 top-6 flex items-center justify-between rounded-2xl bg-raised px-3 py-2 text-xs">
            <span className="text-dim">Faida · Leo</span><span className="money font-display text-base font-semibold text-sukuma">KSh 4,950</span>
          </div>
          <div className="flex h-full flex-col justify-end gap-2.5 pb-14">
            <div className="m-user ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-flame px-3.5 py-2.5 text-sm text-[var(--flame-ink)]">
              <span ref={typed}>{MSG}</span>
            </div>
            <div className="m-typing flex w-14 gap-1 rounded-2xl bg-raised px-3 py-3 opacity-0">
              {[0, 1, 2].map((i) => <span key={i} className="size-1.5 animate-bounce rounded-full bg-dim" style={{ animationDelay: `${i * 0.12}s` }} />)}
            </div>
            <div className="m-receipt relative max-w-[92%] rounded-2xl bg-raised p-3.5 text-sm">
              <p className="flex items-center gap-1.5 text-xs text-dim"><Bot className="size-3.5 text-flame" />Msaidizi</p>
              <ul className="mt-2 space-y-1">
                <li className="flex justify-between"><span>Chai × 3</span><span className="money">KSh 90</span></li>
                <li className="flex justify-between"><span>Chapati × 2</span><span className="money">KSh 40</span></li>
              </ul>
              <p className="mt-2 flex justify-between border-t border-dashed border-line pt-2 font-semibold"><span>Jumla · Cash</span><span className="money">KSh 130</span></p>
              <span className="m-stamp absolute -top-2 -right-2 rotate-[-9deg] rounded-md border-2 border-sukuma px-2 py-0.5 font-display text-xs font-bold tracking-wider text-sukuma">IMEANDIKWA</span>
            </div>
          </div>
          <div className="absolute inset-x-3 bottom-3 flex h-11 items-center gap-2 rounded-full bg-raised pr-1 pl-4 text-xs text-dim">
            <span className="flex-1">Andika au ongea…</span>
            <span className="grid size-9 place-items-center rounded-full bg-flame text-[var(--flame-ink)]"><Mic className="size-4" /></span>
          </div>
        </div>
      </div>
    </section>
  );
}