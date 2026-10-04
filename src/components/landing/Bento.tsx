"use client";
import { motion } from "motion/react";
import { BarChart3, Bell, Check, ChefHat, NotebookPen, Smartphone } from "lucide-react";
import { steam } from "@/lib/motion";
import { cn } from "@/lib/utils/cn";

function MadeniDemo() {
  const rows = [{ n: "Otieno", a: "KSh 250", d: "siku 9" }, { n: "Wanjiku", a: "KSh 120", d: "siku 3" }, { n: "Kamau", a: "KSh 480", d: "siku 14" }];
  return (
    <div className="space-y-2 rounded-2xl bg-overlay p-3">
      {rows.map((r, i) => (
        <div key={r.n} className="relative h-12 overflow-hidden rounded-xl">
          {i === 0 && <div className="absolute inset-0 flex items-center gap-1.5 rounded-xl bg-sukuma px-4 text-sm font-semibold text-white"><Check className="size-4" />Imelipwa · SMS imetumwa</div>}
          <motion.div className="relative flex h-full items-center justify-between rounded-xl bg-raised px-3 text-sm"
            animate={i === 0 ? { x: ["0%", "0%", "105%", "105%", "0%"] } : undefined}
            transition={i === 0 ? { duration: 4.2, times: [0, 0.3, 0.45, 0.85, 1], repeat: Infinity, ease: steam } : undefined}>
            <span>{r.n} <span className="text-xs text-dim">· {r.d}</span></span><span className="money text-nyanya">{r.a}</span>
          </motion.div>
        </div>
      ))}
    </div>
  );
}

function MpesaDemo() {
  const loop = { duration: 4.6, repeat: Infinity, times: [0, 0.14, 0.5, 0.86, 1] };
  return (
    <div className="space-y-3 rounded-2xl bg-overlay p-3 text-xs">
      <motion.div className="rounded-xl bg-raised p-2.5 ring-1 ring-line" animate={{ y: [-24, 0, 0, 0, -24], opacity: [0, 1, 1, 1, 0] }} transition={loop}>
        <p className="font-bold text-sukuma">M-PESA</p><p className="text-dim">SJK7H2 Imethibitishwa. KSh 250 kutoka OTIENO O.</p>
      </motion.div>
      <div className="relative h-11 overflow-hidden rounded-xl bg-raised">
        <span className="absolute inset-0 flex items-center justify-between px-3"><span>Deni · Otieno</span><span className="money text-nyanya">KSh 250</span></span>
        <motion.span className="absolute inset-0 flex items-center gap-1.5 bg-sukuma px-3 font-semibold text-white" animate={{ opacity: [0, 0, 1, 1, 0] }} transition={{ ...loop, times: [0, 0.35, 0.45, 0.86, 1] }}>
          <Check className="size-4" />Imelinganishwa yenyewe
        </motion.span>
      </div>
    </div>
  );
}

function RipotiDemo() {
  const bars = [40, 62, 48, 80, 70, 96, 58];
  return (
    <div className="rounded-2xl bg-overlay p-3">
      <p className="money font-display text-2xl font-semibold text-sukuma">+18%</p>
      <p className="text-xs text-dim">faida wiki hii</p>
      <div className="mt-3 flex h-20 items-end gap-1.5">
        {bars.map((h, i) => (
          <motion.span key={i} className={cn("flex-1 origin-bottom rounded-t-md", i === 5 ? "bg-flame" : "bg-line")} style={{ height: `${h}%` }}
            initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.6, ease: steam }} />
        ))}
      </div>
    </div>
  );
}

function OdaDemo() {
  return (
    <div className="rounded-2xl bg-overlay p-3">
      <div className="grid grid-cols-3 gap-2 text-[11px] text-dim"><span>Mpya</span><span>Inapikwa</span><span>Tayari</span></div>
      <div className="relative mt-2 h-24">
        {[0, 1, 2].map((c) => <span key={c} className="absolute top-0 h-full w-[31%] rounded-xl border border-dashed border-line" style={{ left: `${c * 34.5}%` }} />)}
        <motion.div className="absolute top-2 w-[31%] rounded-xl bg-raised p-2 text-[11px] shadow-lg ring-1 ring-flame/40"
          animate={{ left: ["0%", "0%", "34.5%", "34.5%", "69%", "69%"] }} transition={{ duration: 5, times: [0, 0.2, 0.32, 0.55, 0.67, 1], repeat: Infinity, ease: steam }}>
          <p className="money font-semibold text-flame">KB-1042</p><p className="truncate">Ugali Beef ×2</p>
        </motion.div>
        <motion.span className="absolute -top-1 left-[24%] text-flame" animate={{ rotate: [0, -18, 18, -10, 0, 0], opacity: [1, 1, 1, 1, 1, 0] }} transition={{ duration: 5, times: [0, 0.04, 0.08, 0.12, 0.16, 0.3], repeat: Infinity }}>
          <Bell className="size-4" />
        </motion.span>
      </div>
    </div>
  );
}

function Tile({ icon, title, body, demo, className, row }: { icon: React.ReactNode; title: string; body: string; demo: React.ReactNode; className?: string; row?: boolean }) {
  return (
    <article className={cn("rounded-[28px] border border-line bg-raised p-5", row && "lg:grid lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-6", className)}>
      <div>
        {icon}
        <h3 className="mt-3 font-display text-2xl font-semibold">{title}</h3>
        <p className="mt-1.5 text-dim">{body}</p>
      </div>
      <div className={cn("mt-5", row && "lg:mt-0")}>{demo}</div>
    </article>
  );
}

export function Bento() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <p className="text-sm uppercase tracking-[0.2em] text-flame">Kila kitu kwenye simu moja</p>
      <h2 className="mt-3 max-w-[20ch] font-display text-4xl font-semibold leading-tight lg:text-5xl">Daftari, M-Pesa, ripoti na jikoni. Vinaongea.</h2>
      <div className="mt-10 grid gap-3 lg:grid-cols-6">
        <Tile row className="lg:col-span-4" icon={<NotebookPen className="size-6 text-nyanya" />} title="Madeni hayapotei" body="Telezesha kulia kulipa. Deni likiisha, mteja anapata risiti kwa SMS." demo={<MadeniDemo />} />
        <Tile className="lg:col-span-2" icon={<Smartphone className="size-6 text-sukuma" />} title="M-Pesa inajilinganisha" body="Malipo yanaunganishwa na deni au oda yenyewe." demo={<MpesaDemo />} />
        <Tile className="lg:col-span-2" icon={<BarChart3 className="size-6 text-chai" />} title="Ripoti ya benki" body="Faida ya wiki, CSV na taarifa ya SACCO kwa mkopo." demo={<RipotiDemo />} />
        <Tile row className="lg:col-span-4" icon={<ChefHat className="size-6 text-flame" />} title="Oda live, na ding" body="Wateja wanaagiza kwa QR au WhatsApp. Jikoni linasikia, mteja anafuatilia." demo={<OdaDemo />} />
      </div>
    </section>
  );
}