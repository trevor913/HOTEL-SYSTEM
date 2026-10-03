"use client";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Check, MessageCircleHeart, Moon, Send, Sunrise } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { debtNudges, eveningPulse, morningBrief } from "@/lib/domain/briefs";
import { formatKES } from "@/lib/utils/money";

/** Proactive intelligence on Leo (§6.5): brief of the moment + debt nudges with 1-tap approve. */
export function BriefsCard() {
  const t = useT();
  const s = useApp();
  const toast = useToast((x) => x.show);
  const [showNudges, setShowNudges] = useState(false);
  const hour = new Date().getHours();
  const evening = hour >= 16 || hour < 5;
  const brief = useMemo(() => (evening ? eveningPulse(s) : morningBrief(s)), [s, evening]);
  const nudges = useMemo(() => debtNudges(s).filter((n) => !n.sentToday), [s]);

  const sendToPhone = () => {
    const text = "waText" in brief ? brief.waText : brief.text;
    s.pushOutbox({ to: s.hotel.phone, toName: s.hotel.ownerName, body: text, kind: "brief", status: "sent", channel: "whatsapp" });
    toast(t.briefs.sentWa);
  };
  const approve = (id: string) => { if (s.sendReminder(id)) toast(t.madeni.reminderSent); };
  const approveAll = () => { const n = nudges.map((x) => s.sendReminder(x.customerId)).filter(Boolean).length; toast(`${n} ${t.briefs.sentMany}`); setShowNudges(false); };

  return (
    <section className="mx-5 mt-4 overflow-hidden rounded-3xl border border-line bg-raised">
      <div className="p-4">
        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-dim">
          {evening ? <Moon className="size-3.5 text-chai" /> : <Sunrise className="size-3.5 text-chai" />}
          {evening ? t.briefs.evening : t.briefs.morning}
        </p>
        <p className="mt-2 text-[15px] leading-relaxed">{brief.text}</p>
        {"shopping" in brief && brief.shopping.length > 0 && (
          <ul className="mt-3 space-y-1.5 text-sm">
            {brief.shopping.map((x) => (
              <li key={x.id} className="flex justify-between"><span className="text-dim">{x.name} · {x.buyQty} {x.unit}</span><span className="money">{formatKES(x.estCents)}</span></li>
            ))}
          </ul>
        )}
        <button onClick={sendToPhone} className="mt-3 flex h-11 items-center gap-2 rounded-full bg-overlay px-4 text-sm font-medium">
          <Send className="size-4 text-sukuma" /> {t.briefs.toWhatsapp}
        </button>
      </div>

      {nudges.length > 0 && (
        <div className="border-t border-line">
          <button onClick={() => setShowNudges((v) => !v)} className="flex h-14 w-full items-center gap-3 px-4 text-left" aria-expanded={showNudges}>
            <MessageCircleHeart className="size-5 text-flame" />
            <span className="flex-1 text-sm"><span className="font-medium">{nudges.length} {t.briefs.nudgesTitle}</span><span className="block text-xs text-dim">{t.briefs.nudgesBody}</span></span>
            <span className="money text-sm text-nyanya">{formatKES(nudges.reduce((a, n) => a + n.balanceCents, 0), { compact: true })}</span>
          </button>
          <AnimatePresence initial={false}>
            {showNudges && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <ul className="divide-y divide-line px-4">
                  {nudges.slice(0, 8).map((n) => (
                    <li key={n.customerId} className="flex items-start gap-3 py-3">
                      <Avatar name={n.name} size={36} />
                      <span className="min-w-0 flex-1">
                        <span className="flex justify-between text-sm"><span className="font-medium">{n.name}</span><span className="money text-nyanya">{formatKES(n.balanceCents)}</span></span>
                        <span className="mt-0.5 block text-xs leading-snug text-dim">“{n.body}”</span>
                      </span>
                      <button onClick={() => approve(n.customerId)} aria-label={`${t.madeni.remind} ${n.name}`} className="grid size-11 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--sukuma)_18%,transparent)] text-sukuma"><Check className="size-5" /></button>
                    </li>
                  ))}
                </ul>
                <div className="p-4 pt-1">
                  <button onClick={approveAll} className="h-12 w-full rounded-2xl bg-flame font-medium text-[var(--flame-ink)]">{t.briefs.approveAll} ({nudges.length})</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}