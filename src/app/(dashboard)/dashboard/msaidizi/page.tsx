"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { RotateCcw } from "lucide-react";
import { Composer } from "@/components/chat/Composer";
import { MessageList } from "@/components/chat/MessageList";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { greetingKey } from "@/lib/utils/dates";

export default function MsaidiziPage() {
  return <Suspense><Chat /></Suspense>;
}

function Chat() {
  const t = useT();
  const hasChat = useApp((s) => s.chat.length > 0);
  const clearChat = useApp((s) => s.clearChat);
  const owner = useApp((s) => s.hotel.ownerName);
  const voiceHint = useSearchParams().get("voice") === "1";

  return (
    <div className="flex min-h-[calc(100dvh-var(--tab-h)-var(--safe-b))] flex-col">
      <header className="flex items-center justify-between px-5 pt-safe pb-2">
        <div className="pt-4">
          <p className="text-xs uppercase tracking-[0.16em] text-dim">{t.greet[greetingKey()]}, {owner}</p>
          <h1 className="font-display text-[28px] font-semibold">{t.msaidizi.title}</h1>
        </div>
        {hasChat && <button onClick={clearChat} aria-label="Clear" className="mt-4 grid size-11 place-items-center rounded-full bg-overlay"><RotateCcw className="size-4 text-dim" /></button>}
      </header>
      <div className="flex-1 px-5 pb-40">
        {voiceHint && !hasChat && <p className="mb-3 text-sm text-chai">🎙️ {t.msaidizi.hold}</p>}
        <MessageList />
      </div>
      <div className="fixed inset-x-0 z-30 mx-auto max-w-lg bg-gradient-to-t from-bg via-bg to-transparent px-3 pt-6 pb-2 lg:left-[248px] lg:max-w-3xl" style={{ bottom: "calc(var(--tab-h) + var(--safe-b))" }}>
        <Composer />
      </div>
    </div>
  );
}