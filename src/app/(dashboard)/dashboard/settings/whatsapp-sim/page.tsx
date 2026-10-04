"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { CheckCheck, ChevronLeft, SendHorizontal } from "lucide-react";
import { Segmented } from "@/components/ui/Segmented";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { whatsappReply } from "@/lib/domain/whatsapp-bot";
import { runOfflineAgent } from "@/lib/ai/offline-agent";
import { clockTime } from "@/lib/utils/dates";

type Who = "customer" | "owner";
interface Msg { id: number; from: "me" | "them"; text: string; at: string }
const DEMO_PHONE = "254799123456";

/** WhatsApp-look simulator (§7.3): customers order by text, owner talks to Msaidizi. */
export default function WhatsAppSimPage() {
  const t = useT();
  const s = useApp();
  const toast = useToast((x) => x.show);
  const [who, setWho] = useState<Who>("customer");
  const [threads, setThreads] = useState<Record<Who, Msg[]>>({ customer: [], owner: [] });
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const seq = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  const msgs = threads[who];
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs.length, typing]);

  const push = (w: Who, m: Omit<Msg, "id" | "at">) => setThreads((th) => ({ ...th, [w]: [...th[w], { ...m, id: ++seq.current, at: new Date().toISOString() }] }));

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || typing) return;
    const w = who;
    setInput("");
    push(w, { from: "me", text });
    setTyping(true);
    await new Promise((r) => setTimeout(r, 650));
    let reply: string;
    if (w === "customer") {
      const st = useApp.getState();
      const r = whatsappReply(text, { hotel: st.hotel, menu: st.menu, appUrl: window.location.origin });
      reply = r.text;
      if (r.kind === "order") {
        const o = st.createOrder({ customerName: "Mteja wa WhatsApp", customerPhone: DEMO_PHONE, items: r.items.map((i) => ({ menuItemId: i.itemId, qty: i.qty })), type: r.type, placedVia: "whatsapp" });
        reply = r.text.replace("{CODE}", o.code);
        toast(`${t.whatsapp.orderIn}: ${o.code}`);
      }
    } else {
      const r = runOfflineAgent(text, useApp.getState());
      reply = r.card?.type === "pnl" ? `${r.text}\nMauzo ${fmt(r.card.salesCents)} · Matumizi ${fmt(r.card.expensesCents)} · Faida *${fmt(r.card.profitCents)}*`
        : r.card && "rows" in r.card ? `${r.text}\n${r.card.rows.map((x) => "label" in x ? `• ${x.label}: ${x.value}` : `• ${x.name}: ${fmt(x.cents)}`).join("\n")}` : r.text;
    }
    setTyping(false);
    push(w, { from: "them", text: reply });
  };

  const contact = who === "customer" ? s.hotel.name : "Msaidizi 🤖";
  const quick = who === "customer" ? t.whatsapp.quick : t.whatsapp.quickOwner;

  return (
    <div className="flex min-h-[calc(100dvh-var(--tab-h)-var(--safe-b))] flex-col">
      <header className="flex items-center gap-2 px-5 pt-safe pb-2">
        <Link href="/dashboard/settings" aria-label={t.common.back} className="mt-4 grid size-11 place-items-center rounded-full bg-overlay"><ChevronLeft className="size-5" /></Link>
        <h1 className="mt-4 font-display text-2xl font-semibold">{t.whatsapp.title}</h1>
      </header>
      <div className="px-5">
        <Segmented layoutId="wa-who" value={who} onChange={setWho} options={[{ value: "customer", label: t.whatsapp.customer }, { value: "owner", label: t.whatsapp.owner }]} />
      </div>

      {/* Phone frame */}
      <div className="mx-3 mt-3 mb-3 flex flex-1 flex-col overflow-hidden rounded-[28px] border border-line">
        <div className="flex items-center gap-3 bg-[#075E54] px-4 py-3 text-white">
          <span className="grid size-10 place-items-center rounded-full bg-white/20 text-lg">{who === "customer" ? "🍲" : "🤖"}</span>
          <span><span className="block font-medium leading-tight">{contact}</span><span className="text-xs text-white/75">{typing ? "typing…" : t.whatsapp.online}</span></span>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto bg-[#ECE5DD] px-3 py-4 text-[#111b21] dark:bg-[#0b141a] dark:text-[#e9edef]"
          style={{ backgroundImage: "radial-gradient(rgb(0 0 0 / 0.05) 1px, transparent 1px)", backgroundSize: "14px 14px" }}>
          <p className="mx-auto w-fit max-w-[85%] rounded-lg bg-[#FFF3C4] px-3 py-1.5 text-center text-xs text-[#54656f]">{who === "customer" ? t.whatsapp.intro : t.whatsapp.ownerIntro}</p>
          <AnimatePresence initial={false}>
            {msgs.map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`relative max-w-[82%] rounded-lg px-2.5 pt-1.5 pb-4 text-[14.5px] leading-snug shadow-sm ${m.from === "me" ? "rounded-tr-none bg-[#D9FDD3] text-[#111b21]" : "rounded-tl-none bg-white text-[#111b21]"}`}>
                  <WaText text={m.text} />
                  <span className="absolute right-2 bottom-0.5 flex items-center gap-0.5 text-[10px] text-[#667781]">{clockTime(m.at)}{m.from === "me" && <CheckCheck className="size-3.5 text-[#53bdeb]" />}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {typing && <div className="w-fit rounded-lg rounded-tl-none bg-white px-3 py-2"><span className="flex gap-1">{[0, 1, 2].map((i) => <motion.span key={i} className="size-1.5 rounded-full bg-[#8696a0]" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />)}</span></div>}
          <div ref={endRef} />
        </div>
        <div className="bg-[#F0F2F5] px-2 pt-2 pb-2 dark:bg-[#202c33]">
          <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
            {quick.map((q) => <button key={q} onClick={() => send(q)} className="h-8 shrink-0 rounded-full bg-white px-3 text-[13px] text-[#008069] shadow-sm dark:bg-[#2a3942] dark:text-[#00a884]">{q}</button>)}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); void send(input); }} className="flex items-center gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t.whatsapp.placeholder} aria-label={t.whatsapp.placeholder}
              className="h-12 flex-1 rounded-full bg-white px-4 text-base text-[#111b21] outline-none dark:bg-[#2a3942] dark:text-[#e9edef]" enterKeyHint="send" />
            <motion.button whileTap={{ scale: 0.9 }} type="submit" aria-label="Send" className="grid size-12 place-items-center rounded-full bg-[#00a884] text-white"><SendHorizontal className="size-5" /></motion.button>
          </form>
        </div>
      </div>
    </div>
  );
}

const fmt = (c: number) => `KSh ${Math.round(c / 100).toLocaleString("en-KE")}`;

/** WhatsApp *bold* and _italic_. */
function WaText({ text }: { text: string }) {
  return (
    <p className="whitespace-pre-line break-words">
      {text.split(/(\*[^*\n]+\*|_[^_\n]+_)/g).map((p, i) =>
        p.startsWith("*") && p.endsWith("*") && p.length > 2 ? <strong key={i}>{p.slice(1, -1)}</strong>
          : p.startsWith("_") && p.endsWith("_") && p.length > 2 ? <em key={i}>{p.slice(1, -1)}</em> : <span key={i}>{p}</span>)}
    </p>
  );
}