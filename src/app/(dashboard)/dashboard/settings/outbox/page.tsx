"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { ChevronLeft } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { formatPhone } from "@/lib/utils/phone";
import { timeAgo } from "@/lib/utils/dates";
import { item, list } from "@/lib/motion";

const KIND: Record<string, string> = { receipt: "bg-sukuma/15 text-sukuma", reminder: "bg-chai/15 text-chai", order: "bg-flame/15 text-flame", brief: "bg-[#25D366]/15 text-[#25D366]" };

export default function OutboxPage() {
  const t = useT();
  const sms = useApp((s) => s.sms);
  const lang = useApp((s) => s.lang);
  return (
    <div className="px-5">
      <header className="flex items-center gap-2 pt-safe pb-2">
        <Link href="/dashboard/settings" aria-label={t.common.back} className="mt-4 grid size-11 place-items-center rounded-full bg-overlay"><ChevronLeft className="size-5" /></Link>
        <h1 className="mt-4 font-display text-2xl font-semibold">{t.settings.outbox}</h1>
      </header>
      <p className="text-sm text-dim">{t.settings.outboxBody}</p>
      {sms.length === 0 ? <p className="py-16 text-center text-sm text-dim">{t.settings.noSms}</p> : (
        <motion.ul variants={list} initial="initial" animate="animate" className="mt-4 space-y-3 pb-6">
          {sms.map((m) => (
            <motion.li key={m.id} variants={item} className="rounded-3xl border border-line bg-raised p-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{m.toName}</span>
                <span className="money text-dim">{formatPhone(m.to)}</span>
                <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${KIND[m.kind] ?? ""}`}>{m.kind}</span>
              </div>
              <p className="mt-2 rounded-2xl rounded-tl-md bg-overlay px-3 py-2.5 text-[15px] leading-relaxed">{m.body}</p>
              <p className="mt-1.5 text-xs text-dim">{timeAgo(m.createdAt, lang)} · {m.channel === "whatsapp" ? "WhatsApp" : "Africa's Talking"} (mock)</p>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}
