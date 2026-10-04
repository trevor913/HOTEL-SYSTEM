"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { CalendarClock, Camera, Plus, Trash2, X } from "lucide-react";
import { SubHeader } from "@/components/dashboard/SubHeader";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { formatKES } from "@/lib/utils/money";
import { fileToDataUrl } from "@/lib/utils/image";
import { cn } from "@/lib/utils/cn";
import type { MenuCategory, MenuItem } from "@/lib/types";
import { DishThumb } from "@/components/menu/DishThumb";
import { Field } from "@/components/ui/Field";

const CATS: MenuCategory[] = ["breakfast", "main", "side", "drink", "snack"];
type Draft = { id?: string; name: string; nameSw: string; price: string; category: MenuCategory; emoji: string; imageUrl?: string; description: string };
const blank: Draft = { name: "", nameSw: "", price: "", category: "main", emoji: "🍲", description: "" };


export default function MenuPage() {
  const t = useT();
  const s = useApp();
  const toast = useToast((x) => x.show);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const open = (m?: MenuItem) => {
    setConfirmDel(false);
    setDraft(m ? { id: m.id, name: m.name, nameSw: m.nameSw, price: String(m.priceCents / 100), category: m.category, emoji: m.emoji, imageUrl: m.imageUrl, description: m.description ?? "" } : { ...blank });
  };
  const save = () => {
    if (!draft) return;
    const price = Math.round(Number(draft.price) * 100);
    if (!draft.name.trim() || !(price > 0)) return toast(`${t.ops.name} + ${t.ops.price}`, "warn");
    const patch = { name: draft.name.trim(), nameSw: draft.nameSw.trim() || draft.name.trim(), priceCents: price, category: draft.category, emoji: draft.emoji || "🍲", imageUrl: draft.imageUrl, description: draft.description.trim() || undefined };
    if (draft.id) s.updateMenuItem(draft.id, patch);
    else { const m = s.addMenuItem(patch); s.updateMenuItem(m.id, { imageUrl: patch.imageUrl, description: patch.description }); }
    toast(t.ops.saved);
    setDraft(null);
  };
  const del = () => {
    if (!draft?.id) return;
    if (!confirmDel) return setConfirmDel(true);
    s.deleteMenuItem(draft.id); toast(t.ops.deleted); setDraft(null);
  };
  const pick = async (f?: File) => { if (f && draft) setDraft({ ...draft, imageUrl: await fileToDataUrl(f) }); };

  return (
    <div className="pb-tabs">
      <SubHeader title={t.ops.menu} sub={`${s.menu.length} ${t.ops.items}`} right={
        <Link href="/dashboard/menu/plan" className="flex h-11 items-center gap-1.5 rounded-full bg-overlay px-4 text-sm"><CalendarClock className="size-4 text-chai" />{t.ops.plan}</Link>
      } />
      {CATS.map((c) => {
        const items = s.menu.filter((m) => m.category === c).sort((a, b) => a.sortOrder - b.sortOrder);
        if (!items.length) return null;
        return (
          <section key={c} className="mt-5 px-5">
            <h2 className="text-xs uppercase tracking-[0.16em] text-dim">{t.ops.cats[c]}</h2>
            <ul className="mt-2 divide-y divide-line rounded-3xl border border-line bg-raised">
              {items.map((m) => (
                <li key={m.id} className={cn("flex items-center gap-3 p-3", !m.isAvailable && "opacity-50")}>
                  <button onClick={() => open(m)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <DishThumb m={m} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{m.nameSw}</span>
                      <span className="block truncate text-xs text-dim">{m.name} · <span className="money text-ink">{formatKES(m.priceCents)}</span></span>
                    </span>
                  </button>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <button onClick={() => s.toggleAvailable(m.id)} aria-pressed={m.isAvailable} className={cn("h-8 rounded-full px-3 text-xs font-medium", m.isAvailable ? "bg-[color-mix(in_oklab,var(--sukuma)_18%,transparent)] text-sukuma" : "bg-overlay text-dim")}>{m.isAvailable ? t.ops.available : t.ops.hidden}</button>
                    <button onClick={() => s.setSoldOut(m.id, !m.soldOutToday)} aria-pressed={m.soldOutToday} className={cn("h-8 rounded-full px-3 text-xs font-medium", m.soldOutToday ? "bg-nyanya text-white" : "border border-line text-dim")}>{t.ops.soldOut}</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <div className="h-20" />
      <motion.button whileTap={{ scale: 0.94 }} onClick={() => open()} className="above-tabs fixed right-4 z-30 flex h-14 items-center gap-2 rounded-full bg-flame px-5 font-display font-semibold text-[var(--flame-ink)] shadow-[0_12px_30px_-10px_var(--flame)] lg:bottom-8 lg:right-8">
        <Plus className="size-5" strokeWidth={2.6} />{t.ops.addItem}
      </motion.button>

      <BottomSheet open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? t.ops.editItem : t.ops.addItem} footer={
        <div className="flex gap-2">
          {draft?.id && <button onClick={del} className={cn("flex h-14 items-center gap-2 rounded-2xl px-4 font-medium", confirmDel ? "bg-nyanya text-white" : "bg-overlay text-nyanya")}><Trash2 className="size-5" />{confirmDel ? t.ops.confirmDelete : ""}</button>}
          <button onClick={save} className="h-14 flex-1 rounded-2xl bg-flame font-display text-lg font-semibold text-[var(--flame-ink)]">{t.ops.save}</button>
        </div>
      }>
        {draft && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <DishThumb m={{ ...draft, hue: 30, name: draft.name }} size={88} />
                {draft.imageUrl && <button onClick={() => setDraft({ ...draft, imageUrl: undefined })} aria-label={t.ops.removePhoto} className="absolute -top-2 -right-2 grid size-7 place-items-center rounded-full bg-overlay ring-1 ring-line"><X className="size-4" /></button>}
              </div>
              <button onClick={() => fileRef.current?.click()} className="flex h-12 items-center gap-2 rounded-full border border-line px-4 text-sm"><Camera className="size-4 text-chai" />{t.ops.photo}</button>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => void pick(e.target.files?.[0])} />
            </div>
            <Field label={t.ops.nameSw}><input value={draft.nameSw} onChange={(e) => setDraft({ ...draft, nameSw: e.target.value })} className="input" placeholder="Ugali Nyama" /></Field>
            <Field label={t.ops.name}><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="input" placeholder="Ugali Beef" /></Field>
            <div className="grid grid-cols-[1fr_88px] gap-3">
              <Field label={t.ops.price}><input value={draft.price} inputMode="numeric" onChange={(e) => setDraft({ ...draft, price: e.target.value.replace(/[^\d.]/g, "") })} className="input money" placeholder="150" /></Field>
              <Field label="Emoji"><input value={draft.emoji} maxLength={4} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })} className="input text-center text-xl" /></Field>
            </div>
            <Field label={t.ops.category}>
              <div className="flex flex-wrap gap-2">
                {CATS.map((c) => <button key={c} type="button" onClick={() => setDraft({ ...draft, category: c })} className={cn("h-10 rounded-full px-3.5 text-sm", draft.category === c ? "bg-flame text-[var(--flame-ink)]" : "border border-line")}>{t.ops.cats[c]}</button>)}
              </div>
            </Field>
            <Field label={t.ops.description}><input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="input" maxLength={80} /></Field>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

