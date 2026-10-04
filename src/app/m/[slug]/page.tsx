"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Clock, Languages, MapPin, Minus, Plus, ShoppingBag } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Segmented } from "@/components/ui/Segmented";
import { DishThumb } from "@/components/menu/DishThumb";
import { StkModal } from "@/components/public/StkModal";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { useMounted } from "@/lib/utils/use-mounted";
import { formatKES } from "@/lib/utils/money";
import { normalizePhone } from "@/lib/utils/phone";
import { isOpenNow } from "@/lib/utils/hours";
import { cn } from "@/lib/utils/cn";
import type { MenuCategory } from "@/lib/types";

const CATS: MenuCategory[] = ["breakfast", "main", "side", "snack", "drink"];

export default function PublicMenuPage() {
  const mounted = useMounted();
  return mounted ? <PublicMenu /> : <div className="min-h-dvh bg-bg" />;
}

function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  const t = useT();
  const s = useApp();
  const router = useRouter();
  const toast = useToast((x) => x.show);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [checkout, setCheckout] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", type: "pickup" as "pickup" | "delivery", address: "", pay: "mpesa" as "mpesa" | "later" });
  const [stk, setStk] = useState<{ phone: string; cents: number } | null>(null);

  if (slug !== s.hotel.slug) {
    return <div className="grid min-h-dvh place-items-center p-8 text-center"><p className="font-display text-2xl">{t.pub.hotelNotFound}</p></div>;
  }

  const sw = s.lang === "sw";
  const open = isOpenNow(s.hotel.openHours);
  const visible = s.menu.filter((m) => m.isAvailable).sort((a, b) => a.sortOrder - b.sortOrder);
  const cats = CATS.filter((c) => visible.some((m) => m.category === c));
  const lines = Object.entries(cart).filter(([, q]) => q > 0).map(([id, q]) => ({ m: s.menu.find((x) => x.id === id)!, q })).filter((l) => l.m);
  const total = lines.reduce((a, l) => a + l.m.priceCents * l.q, 0);
  const count = lines.reduce((a, l) => a + l.q, 0);
  const setQty = (id: string, d: number) => setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + d) }));

  const finalize = (phone: string, receipt: string | null, paidByMpesa: boolean) => {
    const st = useApp.getState();
    const name = form.name.trim();
    const o = st.createOrder({
      customerName: name, customerPhone: phone, items: lines.map((l) => ({ menuItemId: l.m.id, qty: l.q })), type: form.type,
      addressText: form.type === "delivery" ? form.address.trim() || undefined : undefined, placedVia: "public_menu",
      paymentStatus: paidByMpesa ? "unpaid" : "pay_on_delivery",
    });
    // Same pipeline as a real Daraja callback: ingest → auto-match marks the order paid.
    if (receipt) st.ingestMpesa({ providerTxId: receipt, type: "stk", phone, amountCents: o.totalCents, payerName: name.toUpperCase(), createdAt: new Date().toISOString() });
    st.pushOutbox({ to: phone, toName: name, kind: "order", status: "sent", channel: "sms", body: `Asante ${name}! Oda ${o.code} (${formatKES(o.totalCents)}) imepokelewa na ${st.hotel.name}. Fuatilia: ${window.location.origin}/m/${slug}/oda/${o.code}` });
    setStk(null); setCart({});
    router.push(`/m/${slug}/oda/${o.code}`);
  };

  const place = () => {
    if (!form.name.trim()) return toast(t.pub.needName, "warn");
    const phone = normalizePhone(form.phone);
    if (!phone) return toast(t.pub.invalidPhone, "warn");
    if (!lines.length) return;
    setCheckout(false);
    if (form.pay === "mpesa") setStk({ phone, cents: total });
    else finalize(phone, null, false);
  };

  return (
    <div className="min-h-dvh bg-bg pb-32">
      {/* Hero */}
      <header className="relative h-[44dvh] min-h-72 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/hero.jpg" alt="" className="absolute inset-0 size-full scale-105 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-black/10" />
        <button onClick={() => s.setLang(sw ? "en" : "sw")} className="absolute top-[max(env(safe-area-inset-top),16px)] right-4 flex h-10 items-center gap-1.5 rounded-full bg-black/45 px-3.5 text-sm text-white backdrop-blur"><Languages className="size-4" />{sw ? "EN" : "SW"}</button>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="absolute inset-x-0 bottom-0 mx-auto max-w-2xl px-5 pb-5">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", open ? "bg-sukuma/20 text-sukuma" : "bg-nyanya/20 text-nyanya")}>
            <span className={cn("size-1.5 rounded-full", open ? "animate-pulse bg-sukuma" : "bg-nyanya")} />{open ? t.pub.openNow : t.pub.closed}
          </span>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-none">{s.hotel.name}</h1>
          <p className="mt-1.5 text-[15px] text-ink/85">{s.hotel.tagline}</p>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-dim">
            <span className="flex items-center gap-1"><MapPin className="size-3.5" />{s.hotel.locationText}</span>
            <span className="flex items-center gap-1"><Clock className="size-3.5" />{s.hotel.openHours.open}–{s.hotel.openHours.close}</span>
          </p>
        </motion.div>
      </header>

      {/* Category jump bar */}
      <nav className="no-scrollbar sticky top-0 z-20 flex gap-2 overflow-x-auto border-b border-line bg-bg/90 px-5 py-3 backdrop-blur-md">
        {cats.map((c) => <a key={c} href={`#c-${c}`} className="h-10 shrink-0 content-center rounded-full border border-line px-4 text-sm">{t.ops.cats[c]}</a>)}
      </nav>

      <main className="mx-auto max-w-2xl px-5">
        {cats.map((c) => (
          <section key={c} id={`c-${c}`} className="scroll-mt-20 pt-6">
            <h2 className="font-display text-xl font-semibold">{t.ops.cats[c]}</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {visible.filter((m) => m.category === c).map((m) => {
                const q = cart[m.id] ?? 0;
                return (
                  <li key={m.id} className={cn("flex gap-3 rounded-3xl border border-line bg-raised p-3", m.soldOutToday && "opacity-55")}>
                    <DishThumb m={m} size={84} />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">{sw ? m.nameSw : m.name}</span>
                      <span className="truncate text-xs text-dim">{sw ? m.name : m.nameSw}</span>
                      {m.description && <span className="mt-0.5 line-clamp-2 text-xs text-dim">{m.description}</span>}
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="money font-display text-lg font-semibold">{formatKES(m.priceCents)}</span>
                        {m.soldOutToday ? <span className="rounded-full bg-overlay px-3 py-1 text-xs text-nyanya">{t.pub.soldOut}</span>
                          : q ? (
                            <span className="flex items-center gap-1">
                              <button onClick={() => setQty(m.id, -1)} aria-label="−" className="grid size-10 place-items-center rounded-full bg-overlay"><Minus className="size-4" /></button>
                              <span className="money w-6 text-center font-semibold">{q}</span>
                              <button onClick={() => setQty(m.id, 1)} aria-label="+" className="grid size-10 place-items-center rounded-full bg-flame text-[var(--flame-ink)]"><Plus className="size-4" /></button>
                            </span>
                          ) : (
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setQty(m.id, 1)} className="flex h-10 items-center gap-1 rounded-full bg-flame px-4 text-sm font-semibold text-[var(--flame-ink)]"><Plus className="size-4" />{t.pub.add}</motion.button>
                          )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        <p className="py-10 text-center text-xs text-dim">Till {s.hotel.tillNumber} · <Link href="/" className="underline">{t.pub.poweredBy}</Link></p>
      </main>

      {/* Sticky cart */}
      <AnimatePresence>
        {count > 0 && !stk && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-2xl px-4 pb-[max(env(safe-area-inset-bottom),16px)]">
            <button onClick={() => setCheckout(true)} className="flex h-16 w-full items-center gap-3 rounded-2xl bg-flame px-5 text-[var(--flame-ink)] shadow-[0_16px_40px_-12px_var(--flame)]">
              <span className="relative"><ShoppingBag className="size-6" /><motion.span key={count} initial={{ scale: 1.6 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2.5 grid size-5 place-items-center rounded-full bg-ink text-[11px] font-bold text-bg">{count}</motion.span></span>
              <span className="flex-1 text-left font-display text-lg font-semibold">{t.pub.order}</span>
              <span className="money font-display text-lg font-semibold">{formatKES(total)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomSheet open={checkout} onClose={() => setCheckout(false)} title={t.pub.cart} footer={
        <button onClick={place} disabled={!lines.length} className="flex h-14 w-full items-center justify-between rounded-2xl bg-flame px-5 font-display text-lg font-semibold text-[var(--flame-ink)] disabled:opacity-40">
          <span>{form.pay === "mpesa" ? t.pub.payMpesa : t.pub.placeOrder}</span><span className="money">{formatKES(total)}</span>
        </button>
      }>
        <ul className="divide-y divide-line">
          {lines.map(({ m, q }) => (
            <li key={m.id} className="flex items-center gap-3 py-2">
              <span className="flex-1 truncate text-sm">{m.emoji} {sw ? m.nameSw : m.name}</span>
              <button onClick={() => setQty(m.id, -1)} aria-label="−" className="grid size-10 place-items-center rounded-full bg-overlay"><Minus className="size-4" /></button>
              <span className="money w-5 text-center">{q}</span>
              <button onClick={() => setQty(m.id, 1)} aria-label="+" className="grid size-10 place-items-center rounded-full bg-overlay"><Plus className="size-4" /></button>
              <span className="money w-20 text-right text-sm">{formatKES(m.priceCents * q)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t.pub.yourName} autoComplete="name" className="input" />
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={t.pub.phone} inputMode="tel" autoComplete="tel" className="input money" />
          <Segmented layoutId="pub-type" value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={[{ value: "pickup", label: t.pub.pickup }, { value: "delivery", label: t.pub.delivery }]} />
          {form.type === "delivery" && <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder={t.pub.address} className="input" />}
          <Segmented layoutId="pub-pay" value={form.pay} onChange={(v) => setForm({ ...form, pay: v })} options={[{ value: "mpesa", label: "M-Pesa" }, { value: "later", label: t.pub.payLater }]} />
        </div>
      </BottomSheet>

      <StkModal open={!!stk} phone={stk?.phone ?? ""} amountCents={stk?.cents ?? 0} merchant={s.hotel.name}
        onClose={() => { setStk(null); setCheckout(true); }}
        onDone={(receipt) => stk && finalize(stk.phone, receipt, true)} />
    </div>
  );
}