"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";
import { Bot, Maximize2 } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Composer } from "@/components/chat/Composer";
import { MessageList } from "@/components/chat/MessageList";
import { useT } from "@/lib/i18n";
import { useMsaidizi } from "@/lib/ai/use-msaidizi";

/** Floating Msaidizi on every dashboard page (§6.6). Bottom-left, so it never fights the + FAB. */
export function MsaidiziLauncher() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const { busy } = useMsaidizi();
  return (
    <>
      <motion.button whileTap={{ scale: 0.92 }} onClick={() => setOpen(true)} aria-label={t.msaidizi.title}
        className="above-tabs fixed left-4 z-30 grid size-14 place-items-center rounded-full border border-line bg-overlay shadow-lg lg:bottom-8 lg:left-[272px]">
        <Bot className="size-6 text-flame" />
        {busy && <span className="pulse-ring absolute top-1 right-1 size-2.5 rounded-full bg-flame" />}
      </motion.button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title={t.msaidizi.title} footer={<Composer showSuggestions={false} />}>
        <div className="mb-2 flex justify-end">
          <Link href="/dashboard/msaidizi" onClick={() => setOpen(false)} className="flex items-center gap-1.5 text-xs text-dim"><Maximize2 className="size-3.5" />{t.common.more}</Link>
        </div>
        <MessageList limit={20} className="min-h-[30dvh]" />
      </BottomSheet>
    </>
  );
}