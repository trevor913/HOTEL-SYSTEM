import { formatKES } from "@/lib/utils/money";
import type { ChatCard as Card } from "@/lib/types";

/** Torn-paper receipt edge */
const TORN = "linear-gradient(#000 0 0) top/100% calc(100% - 8px) no-repeat, radial-gradient(circle at 8px 0, transparent 5px, #000 5.5px) bottom/16px 8px repeat-x";

export function ChatCard({ card }: { card: Card }) {
  if (card.type === "pnl") {
    const pos = card.profitCents >= 0;
    return (
      <div className="mt-2 w-full max-w-[300px] overflow-hidden rounded-2xl border border-line bg-bg">
        <div className="flex items-baseline justify-between px-4 pt-3"><span className="text-xs uppercase tracking-[0.14em] text-dim">{card.label}</span><span className="text-[10px] text-dim">P&amp;L</span></div>
        <dl className="space-y-1.5 px-4 py-3 text-sm">
          <Row k="Mauzo" v={formatKES(card.salesCents)} />
          <Row k="Matumizi" v={`−${formatKES(card.expensesCents).replace("KSh ", "")}`} tone="text-nyanya" />
          <Row k="Madeni mpya" v={formatKES(card.newDebtsCents)} tone="text-chai" />
        </dl>
        <div className={`flex items-baseline justify-between px-4 py-3 ${pos ? "bg-sukuma/12" : "bg-nyanya/12"}`}>
          <span className="font-medium">Faida</span>
          <span className={`money font-display text-2xl font-semibold ${pos ? "text-sukuma" : "text-nyanya"}`}>{formatKES(card.profitCents)}</span>
        </div>
      </div>
    );
  }
  if (card.type === "receipt") {
    return (
      <div className="relative mt-2 w-full max-w-[300px] rounded-t-xl bg-ugali px-4 pt-3 pb-5 text-[#2a2118]" style={{ WebkitMask: TORN, mask: TORN }}>
        <p className="font-display text-sm font-semibold uppercase tracking-wider">{card.title}</p>
        <div className="my-2 border-t border-dashed border-[#2a2118]/30" />
        {card.lines.map((l, i) => <div key={i} className="flex justify-between text-sm"><span>{l.label}</span><span className="money">{formatKES(l.cents)}</span></div>)}
        <div className="my-2 border-t border-dashed border-[#2a2118]/30" />
        <div className="flex justify-between font-semibold"><span>Jumla</span><span className="money">{formatKES(card.totalCents)}</span></div>
        {card.stamp && <span className="absolute top-3 right-3 -rotate-12 rounded border-2 border-sukuma px-1.5 text-[10px] font-bold tracking-widest text-sukuma">{card.stamp}</span>}
      </div>
    );
  }
  if (card.type === "debts") {
    return (
      <div className="mt-2 w-full max-w-[300px] rounded-2xl border border-line bg-bg p-3">
        {card.rows.map((r) => (
          <div key={r.name} className="flex items-center justify-between py-1.5 text-sm">
            <span>{r.name} <span className={`text-xs ${r.days > 30 ? "text-nyanya" : "text-dim"}`}>· siku {r.days}</span></span>
            <span className="money text-nyanya">{formatKES(r.cents)}</span>
          </div>
        ))}
        <div className="mt-1 flex justify-between border-t border-line pt-2 font-medium"><span>Jumla</span><span className="money text-nyanya">{formatKES(card.totalCents)}</span></div>
      </div>
    );
  }
  return (
    <div className="mt-2 w-full max-w-[300px] rounded-2xl border border-line bg-bg p-3">
      <p className="mb-1 text-xs uppercase tracking-[0.14em] text-dim">{card.title}</p>
      {card.rows.map((r) => <div key={r.label} className="flex justify-between py-1 text-sm"><span>{r.label}</span><span className="money text-chai">{r.value}</span></div>)}
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: string }) {
  return <div className="flex justify-between"><dt className="text-dim">{k}</dt><dd className={`money ${tone ?? ""}`}>{v}</dd></div>;
}
