"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import confetti from "canvas-confetti";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Languages, MapPin, Receipt, Smartphone } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { DISHES } from "@/lib/demo/dishes";
import { useMounted } from "@/lib/utils/use-mounted";
import { normalizePhone } from "@/lib/utils/phone";
import { cn } from "@/lib/utils/cn";
import { steam } from "@/lib/motion";

const AREAS = ["Kangemi", "Githurai 45", "Rongai", "Kayole", "Kawangware", "Pipeline", "Zimmerman", "Ruaka", "Kitengela", "Thika Road"];

export default function OnboardingPage() {
  const mounted = useMounted();
  return mounted ? <Onboarding /> : <div className="min-h-dvh bg-bg" />;
}

function Onboarding() {
  const t = useT();
  const router = useRouter();
  const lang = useApp((s) => s.lang);
  const setLang = useApp((s) => s.setLang);
  const complete = useApp((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [f, setF] = useState({ hotel: "", owner: "", location: "", open: "06:00", close: "21:30", till: "", phone: "" });
  const [picked, setPicked] = useState<Record<string, number | null>>(() => Object.fromEntries(DISHES.map((d) => [d.key, d.popular ? d.kes : null])));
  const chosen = useMemo(() => DISHES.filter((d) => picked[d.key] != null), [picked]);

  const valid = [f.hotel.trim().length >= 2 && f.owner.trim().length >= 2, f.location.trim().length >= 2, chosen.length > 0, true, true][step];
  const go = (d: number) => { setDir(d); setStep((s) => Math.min(4, Math.max(0, s + d))); };

  const finish = () => {
    complete({
      hotelName: f.hotel.trim(), ownerName: f.owner.trim(), locationText: f.location.trim(), openHours: { open: f.open, close: f.close },
      tillNumber: f.till.replace(/\D/g, ""), phone: normalizePhone(f.phone) ?? "",
      dishes: chosen.map((d) => ({ name: d.name, nameSw: d.nameSw, category: d.category, priceCents: (picked[d.key] ?? d.kes) * 100, emoji: d.emoji, hue: d.hue })),
    });
    go(1);
  };

  useEffect(() => {
    if (step !== 4 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const colors = ["#ff6b2c", "#3e9b4f", "#c99a5b"];
    void confetti({ particleCount: 110, spread: 80, origin: { y: 0.55 }, colors });
    const id = setTimeout(() => void confetti({ particleCount: 60, spread: 120, origin: { y: 0.4 }, colors }), 350);
    return () => clearTimeout(id);
  }, [step]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-bg px-5 pt-safe">
      <header className="flex items-center justify-between pt-4">
        {step > 0 && step < 4 ? <button onClick={() => go(-1)} aria-label={t.common.back} className="grid size-11 place-items-center rounded-full bg-overlay"><ArrowLeft className="size-5" /></button> : <Logo className="text-lg" />}
        <button onClick={() => setLang(lang === "sw" ? "en" : "sw")} className="flex h-10 items-center gap-1.5 rounded-full bg-overlay px-3.5 text-sm"><Languages className="size-4" />{lang === "sw" ? "EN" : "SW"}</button>
      </header>

      {step < 4 && (
        <div className="mt-5 flex gap-1.5" aria-label={`${step + 1}/4`}>
          {[0, 1, 2, 3].map((i) => <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-overlay"><motion.span className="block h-full bg-flame" initial={false} animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: 0.4, ease: steam }} /></span>)}
        </div>
      )}

      <AnimatePresence mode="wait" custom={dir}>
        <motion.main key={step} custom={dir} initial={{ opacity: 0, x: dir * 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -40 }} transition={{ duration: 0.35, ease: steam }} className="flex flex-1 flex-col pt-7">
          {step === 0 && (
            <>
              <p className="text-sm text-flame">{t.onb.step} 1/4</p>
              <h1 className="mt-2 font-display text-4xl font-semibold leading-tight">{t.onb.nameTitle}</h1>
              <p className="mt-2 text-dim">{t.onb.nameBody}</p>
              <div className="mt-7 space-y-3">
                <input autoFocus value={f.hotel} onChange={(e) => setF({ ...f, hotel: e.target.value })} placeholder={t.onb.hotelPh} className="input text-lg" aria-label={t.onb.hotelPh} />
                <input value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })} placeholder={t.onb.ownerPh} className="input" aria-label={t.onb.ownerPh} autoComplete="name" />
              </div>
              <Link href="/dashboard" className="mt-6 text-sm text-dim underline underline-offset-4">{t.onb.demoFirst}</Link>
            </>
          )}

          {step === 1 && (
            <>
              <p className="text-sm text-flame">{t.onb.step} 2/4</p>
              <h1 className="mt-2 font-display text-4xl font-semibold leading-tight">{t.onb.whereTitle}</h1>
              <p className="mt-2 text-dim">{t.onb.whereBody}</p>
              <div className="relative mt-7">
                <MapPin className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-dim" />
                <input autoFocus value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} placeholder={t.onb.wherePh} className="input pl-12" aria-label={t.onb.wherePh} />
              </div>
              <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
                {AREAS.map((a) => <button key={a} onClick={() => setF({ ...f, location: `${a}, Nairobi` })} className="h-10 shrink-0 rounded-full border border-line px-3.5 text-sm">{a}</button>)}
              </div>
              <p className="mt-6 text-xs uppercase tracking-[0.16em] text-dim">{t.onb.hours}</p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <label className="text-xs text-dim">{t.onb.opens}<input type="time" value={f.open} onChange={(e) => setF({ ...f, open: e.target.value })} className="input money mt-1" /></label>
                <label className="text-xs text-dim">{t.onb.closes}<input type="time" value={f.close} onChange={(e) => setF({ ...f, close: e.target.value })} className="input money mt-1" /></label>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-flame">{t.onb.step} 3/4</p>
              <h1 className="mt-2 font-display text-4xl font-semibold leading-tight">{t.onb.dishTitle}</h1>
              <p className="mt-2 text-dim">{t.onb.dishBody}</p>
              <ul className="mt-5 -mx-1 divide-y divide-line pb-4">
                {DISHES.map((d) => {
                  const on = picked[d.key] != null;
                  return (
                    <li key={d.key} className="flex items-center gap-3 px-1 py-2">
                      <button onClick={() => setPicked({ ...picked, [d.key]: on ? null : d.kes })} role="checkbox" aria-checked={on} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg border-2 transition-colors", on ? "border-flame bg-flame text-[var(--flame-ink)]" : "border-line")}>{on && <Check className="size-4" strokeWidth={3} />}</span>
                        <span className="text-xl">{d.emoji}</span>
                        <span className="min-w-0 truncate">{lang === "sw" ? d.nameSw : d.name}</span>
                      </button>
                      {on && (
                        <label className="flex h-11 w-28 shrink-0 items-center rounded-xl bg-overlay px-3 text-sm">
                          <span className="text-dim">KSh</span>
                          <input value={picked[d.key] ?? ""} inputMode="numeric" aria-label={`${d.name} price`} onChange={(e) => setPicked({ ...picked, [d.key]: Number(e.target.value.replace(/\D/g, "")) || 0 })} className="money w-full bg-transparent pl-1.5 text-right outline-none" />
                        </label>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-sm text-flame">{t.onb.step} 4/4</p>
              <h1 className="mt-2 font-display text-4xl font-semibold leading-tight">{t.onb.mpesaTitle}</h1>
              <p className="mt-2 text-dim">{t.onb.mpesaBody}</p>
              <div className="mt-7 space-y-3">
                <div className="relative">
                  <Smartphone className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-sukuma" />
                  <input value={f.till} onChange={(e) => setF({ ...f, till: e.target.value.replace(/\D/g, "").slice(0, 8) })} inputMode="numeric" placeholder={t.onb.tillPh} className="input money pl-12 text-lg" aria-label={t.onb.tillPh} />
                </div>
                <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} inputMode="tel" placeholder={t.onb.phonePh} className="input money" aria-label={t.onb.phonePh} />
              </div>
              <p className="mt-4 rounded-2xl bg-overlay p-3 text-xs text-dim">{t.onb.mpesaNote}</p>
            </>
          )}

          {step === 4 && (
            <div className="flex flex-1 flex-col items-center justify-center pb-10 text-center">
              <motion.div initial={{ scale: 0.5, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 14 }}><Logo className="text-4xl" /></motion.div>
              <h1 className="mt-8 font-display text-4xl font-semibold leading-tight">{t.onb.doneTitle}</h1>
              <p className="mt-3 max-w-xs text-dim">{f.hotel} · {chosen.length} {t.ops.items}. {t.onb.doneBody}</p>
            </div>
          )}
        </motion.main>
      </AnimatePresence>

      <footer className="sticky bottom-0 -mx-5 border-t border-line bg-bg/95 px-5 pt-3 pb-[max(env(safe-area-inset-bottom),16px)] backdrop-blur">
        {step < 3 && (
          <button disabled={!valid} onClick={() => go(1)} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-flame font-display text-lg font-semibold text-[var(--flame-ink)] disabled:opacity-40">
            {step === 2 ? `${t.onb.next} · ${chosen.length}` : t.onb.next}<ArrowRight className="size-5" />
          </button>
        )}
        {step === 3 && (
          <div className="flex gap-2">
            <button onClick={() => { setF({ ...f, till: "" }); finish(); }} className="h-14 rounded-2xl border border-line px-5 font-medium">{t.onb.skip}</button>
            <button onClick={finish} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-flame font-display text-lg font-semibold text-[var(--flame-ink)]">{t.onb.finish}<ArrowRight className="size-5" /></button>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-2">
            <button onClick={() => router.push("/dashboard/mauzo")} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-flame font-display text-lg font-semibold text-[var(--flame-ink)]"><Receipt className="size-5" />{t.onb.firstSale}</button>
            <button onClick={() => router.push("/dashboard")} className="h-12 w-full rounded-2xl text-sm text-dim">{t.onb.toHome}</button>
          </div>
        )}
      </footer>
    </div>
  );
}