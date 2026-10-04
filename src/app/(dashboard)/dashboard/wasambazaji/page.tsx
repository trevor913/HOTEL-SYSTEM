"use client";
import { useMemo, useState } from "react";
import { Phone, Plus } from "lucide-react";
import { SubHeader } from "@/components/dashboard/SubHeader";
import { Avatar } from "@/components/ui/Avatar";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Keypad, AmountDisplay } from "@/components/ui/Keypad";
import { Segmented } from "@/components/ui/Segmented";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { formatKES } from "@/lib/utils/money";
import { formatPhone } from "@/lib/utils/phone";
import { timeAgo } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

type Sheet = { kind: "pay" | "buy"; supplierId: string } | null;

export default function SuppliersPage() {
  const t = useT();
  const s = useApp();
  const toast = useToast((x) => x.show);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"cash" | "mpesa">("mpesa");
  const [desc, setDesc] = useState("");
  const [credit, setCredit] = useState(true);
  const total = s.suppliers.reduce((a, x) => a + x.balanceOwedCents, 0);
  const sup = sheet ? s.suppliers.find((x) => x.id === sheet.supplierId) : undefined;

  const ledger = useMemo(() => {
    if (!openId) return [];
    const buys = s.expenses.filter((e) => e.supplierId === openId).map((e) => ({ id: e.id, label: e.description, cents: e.amountCents, at: e.createdAt, dir: "buy" as const }));
    const pays = s.supplierPayments.filter((p) => p.supplierId === openId).map((p) => ({ id: p.id, label: p.method === "mpesa" ? "M-Pesa" : "Cash", cents: p.amountCents, at: p.createdAt, dir: "pay" as const }));
    return [...buys, ...pays].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
  }, [openId, s.expenses, s.supplierPayments]);

  const start = (kind: "pay" | "buy", supplierId: string) => {
    const owed = s.suppliers.find((x) => x.id === supplierId)?.balanceOwedCents ?? 0;
    setAmount(kind === "pay" && owed ? String(owed / 100) : ""); setDesc(""); setCredit(true); setSheet({ kind, supplierId });
  };
  const submit = () => {
    const cents = Number(amount) * 100;
    if (!sheet || !(cents > 0)) return;
    if (sheet.kind === "pay") { s.paySupplier({ supplierId: sheet.supplierId, amountCents: cents, method }); toast(`${t.ops.paidToast} ✓`); }
    else { s.logSupplierPurchase({ supplierId: sheet.supplierId, description: desc.trim() || sup?.whatTheySupply || t.ops.purchase, amountCents: cents, paid: !credit }); toast(`${t.ops.saved} ✓`); }
    setSheet(null);
  };

  return (
    <div className="pb-tabs">
      <SubHeader title={t.ops.suppliers} />
      <section className="mx-5 mt-2 rounded-3xl border border-line bg-raised p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-dim">{t.ops.totalOwed}</p>
        <p className={cn("money font-display text-4xl font-semibold", total ? "text-nyanya" : "text-sukuma")}>{formatKES(total)}</p>
      </section>
      <ul className="mt-4 space-y-3 px-5 pb-6">
        {[...s.suppliers].sort((a, b) => b.balanceOwedCents - a.balanceOwedCents).map((x) => (
          <li key={x.id} className="overflow-hidden rounded-3xl border border-line bg-raised">
            <button onClick={() => setOpenId(openId === x.id ? null : x.id)} className="flex w-full items-center gap-3 p-4 text-left" aria-expanded={openId === x.id}>
              <Avatar name={x.name} size={44} />
              <span className="min-w-0 flex-1"><span className="block truncate font-medium">{x.name}</span><span className="block truncate text-xs text-dim">{x.whatTheySupply}</span></span>
              <span className="text-right"><span className={cn("money block font-display text-lg font-semibold", x.balanceOwedCents ? "text-nyanya" : "text-dim")}>{x.balanceOwedCents ? formatKES(x.balanceOwedCents) : t.ops.allPaid}</span></span>
            </button>
            {openId === x.id && (
              <div className="border-t border-line px-4 pb-3">
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-dim">{t.ops.ledger}</p>
                <ul className="mt-1 divide-y divide-line text-sm">
                  {ledger.map((l) => <li key={l.id} className="flex justify-between py-2"><span>{l.label} <span className="text-xs text-dim">· {timeAgo(l.at, s.lang)}</span></span><span className={cn("money", l.dir === "pay" ? "text-sukuma" : "")}>{l.dir === "pay" ? "−" : ""}{formatKES(l.cents)}</span></li>)}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-3 border-t border-line text-sm">
              <a href={`tel:+${x.phone}`} className="flex h-12 items-center justify-center gap-1.5 text-dim"><Phone className="size-4" />{t.ops.call}</a>
              <button onClick={() => start("buy", x.id)} className="flex h-12 items-center justify-center gap-1.5 border-x border-line"><Plus className="size-4 text-chai" />{t.ops.purchase}</button>
              <button onClick={() => start("pay", x.id)} disabled={!x.balanceOwedCents} className="flex h-12 items-center justify-center gap-1.5 font-medium text-sukuma disabled:opacity-40">{t.ops.pay}</button>
            </div>
          </li>
        ))}
      </ul>

      <BottomSheet open={!!sheet} onClose={() => setSheet(null)} title={sup ? `${sheet?.kind === "pay" ? t.ops.pay : t.ops.logPurchase}: ${sup.name}` : ""} footer={
        <button onClick={submit} disabled={!(Number(amount) > 0)} className="h-14 w-full rounded-2xl bg-flame font-display text-lg font-semibold text-[var(--flame-ink)] disabled:opacity-40">{t.ops.save}</button>
      }>
        {sheet && (
          <div className="space-y-3">
            {sheet.kind === "buy" && <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={`${t.ops.whatBought} (${sup?.whatTheySupply})`} className="input" />}
            <AmountDisplay value={amount} />
            {sheet.kind === "pay"
              ? <Segmented layoutId="sup-pay" value={method} onChange={setMethod} options={[{ value: "mpesa", label: t.pay.mpesa }, { value: "cash", label: t.pay.cash }]} />
              : <Segmented layoutId="sup-buy" value={credit ? "credit" : "paid"} onChange={(v) => setCredit(v === "credit")} options={[{ value: "credit", label: t.ops.onCredit }, { value: "paid", label: t.ops.paidNow }]} />}
            <Keypad value={amount} onChange={setAmount} />
            {sup && <p className="text-center text-xs text-dim">{formatPhone(sup.phone)}</p>}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}