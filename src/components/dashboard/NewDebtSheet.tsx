"use client";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, Search, UserPlus } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { AmountDisplay, Keypad } from "@/components/ui/Keypad";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { normalizePhone } from "@/lib/utils/phone";

/** New debt in ≤ 3 taps: customer → amount → save (§8.2). */
export function NewDebtSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const customers = useApp((s) => s.customers);
  const logDebt = useApp((s) => s.logDebt);
  const addCustomer = useApp((s) => s.addCustomer);
  const toast = useToast((s) => s.show);
  const [step, setStep] = useState<"pick" | "new" | "amount">("pick");
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [q, setQ] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const list = useMemo(() => {
    const s = q.toLowerCase();
    return [...customers].filter((c) => !s || c.name.toLowerCase().includes(s) || c.nickname?.toLowerCase().includes(s)).sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt)).slice(0, 30);
  }, [customers, q]);
  const selected = customers.find((c) => c.id === customerId);

  const reset = () => { setStep("pick"); setCustomerId(undefined); setQ(""); setAmount(""); setNote(""); setName(""); setPhone(""); };
  const close = () => { onClose(); setTimeout(reset, 300); };
  const save = () => {
    if (!customerId || !Number(amount)) return;
    logDebt({ customerId, amountCents: Number(amount) * 100, description: note || "Chakula" });
    toast(`📒 ${selected?.name.split(" ")[0]}: KSh ${Number(amount).toLocaleString("en-KE")}`);
    close();
  };

  return (
    <BottomSheet open={open} onClose={close} title={t.madeni.newDebt}
      footer={step === "amount" ? (
        <motion.button whileTap={{ scale: 0.97 }} disabled={!Number(amount)} onClick={save}
          className="h-14 w-full rounded-2xl bg-flame font-display text-lg font-semibold text-[var(--flame-ink)] disabled:opacity-40">{t.madeni.save}</motion.button>
      ) : step === "new" ? (
        <motion.button whileTap={{ scale: 0.97 }} disabled={name.trim().length < 2}
          onClick={() => { const id = addCustomer({ name: name.trim(), phone: normalizePhone(phone) }); setCustomerId(id); setStep("amount"); }}
          className="h-14 w-full rounded-2xl bg-flame font-display text-lg font-semibold text-[var(--flame-ink)] disabled:opacity-40">{t.common.done}</motion.button>
      ) : undefined}>
      {step === "pick" && (
        <div>
          <label className="mt-2 flex h-12 items-center gap-2 rounded-2xl bg-overlay px-4">
            <Search className="size-4 text-dim" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.madeni.search} className="h-full flex-1 bg-transparent text-base outline-none placeholder:text-dim" />
          </label>
          <button onClick={() => { setName(q); setStep("new"); }} className="mt-3 flex h-14 w-full items-center gap-3 rounded-2xl border border-dashed border-line px-4 text-left text-flame">
            <UserPlus className="size-5" /> {t.madeni.newCustomer}{q && `: “${q}”`}
          </button>
          <ul className="mt-2 divide-y divide-line">
            {list.map((c) => (
              <li key={c.id}>
                <button onClick={() => { setCustomerId(c.id); setStep("amount"); }} className="flex h-16 w-full items-center gap-3 text-left">
                  <Avatar name={c.name} size={40} />
                  <span className="flex-1"><span className="block font-medium">{c.name}</span>{c.nickname && <span className="text-sm text-dim">“{c.nickname}”</span>}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {step === "new" && (
        <div className="mt-3 space-y-3">
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={t.madeni.name} className="h-14 w-full rounded-2xl bg-overlay px-4 text-base outline-none" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder={`${t.madeni.phone} — 07XX XXX XXX`} className="h-14 w-full rounded-2xl bg-overlay px-4 text-base outline-none" />
        </div>
      )}
      {step === "amount" && selected && (
        <div>
          <button onClick={() => setStep("pick")} className="mt-2 flex items-center gap-3 rounded-2xl bg-overlay p-3 pr-4">
            <ChevronLeft className="size-4 text-dim" />
            <Avatar name={selected.name} size={36} /><span className="font-medium">{selected.name}</span>
          </button>
          <AmountDisplay value={amount} tone="nyanya" />
          <div className="no-scrollbar -mx-5 mb-3 flex gap-2 overflow-x-auto px-5">
            {[100, 150, 180, 250, 500, 1000].map((v) => (
              <button key={v} onClick={() => setAmount(String(v))} className="money h-10 shrink-0 rounded-full border border-line px-4 text-sm">{v}</button>
            ))}
          </div>
          <Keypad value={amount} onChange={setAmount} />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.madeni.note} className="mt-3 h-12 w-full rounded-2xl bg-overlay px-4 text-base outline-none" />
        </div>
      )}
    </BottomSheet>
  );
}
