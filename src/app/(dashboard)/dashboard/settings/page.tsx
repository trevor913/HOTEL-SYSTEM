"use client";
import Link from "next/link";
import { ChevronRight, Languages, LayoutGrid, Lock, MessageCircle, MessageSquareText, Moon, RefreshCcw, ShoppingBasket, Smartphone, Sun } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { formatPhone } from "@/lib/utils/phone";

export default function SettingsPage() {
  const t = useT();
  const s = useApp();
  const toast = useToast((x) => x.show);
  const unmatched = s.mpesa.filter((m) => m.status === "unmatched").length;

  return (
    <div className="px-5">
      <PageHeader title={t.settings.title} eyebrow={s.hotel.name} />
      <section className="mt-3 rounded-3xl border border-line bg-raised p-4">
        <p className="font-display text-lg font-semibold">{s.hotel.name}</p>
        <p className="text-sm text-dim">{s.hotel.locationText}</p>
        <p className="money mt-2 text-sm">Till <span className="text-chai">{s.hotel.tillNumber}</span> · {formatPhone(s.hotel.phone)}</p>
      </section>

      <section className="mt-5 space-y-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm text-dim"><Languages className="size-4" />{t.settings.language}</p>
          <Segmented layoutId="lang" value={s.lang} onChange={s.setLang} options={[{ value: "sw", label: "Kiswahili" }, { value: "en", label: "English" }]} />
        </div>
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm text-dim">{s.theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}{t.settings.theme}</p>
          <Segmented layoutId="theme" value={s.theme} onChange={s.setTheme} options={[{ value: "dark", label: t.settings.dark }, { value: "light", label: t.settings.light }]} />
        </div>
      </section>

      <nav className="mt-6 divide-y divide-line rounded-3xl border border-line bg-raised">
        <Link href="/dashboard/matumizi" className="flex h-16 items-center gap-3 px-4"><ShoppingBasket className="size-5 text-chai" /><span className="flex-1">{t.nav.matumizi}</span><ChevronRight className="size-4 text-dim" /></Link>
        <Link href="/dashboard/settings/outbox" className="flex h-16 items-center gap-3 px-4"><MessageSquareText className="size-5 text-chai" /><span className="flex-1">{t.settings.outbox}</span><span className="money text-sm text-dim">{s.sms.length}</span><ChevronRight className="size-4 text-dim" /></Link>
      </nav>

      <p className="mt-6 mb-2 text-xs uppercase tracking-[0.16em] text-dim">{t.settings.integrations}</p>
      <nav className="divide-y divide-line rounded-3xl border border-line bg-raised">
        <Link href="/dashboard/reconcile" className="flex h-16 items-center gap-3 px-4"><Smartphone className="size-5 text-sukuma" /><span className="flex-1">{t.settings.reconcile}</span>{unmatched > 0 && <span className="grid h-6 min-w-6 place-items-center rounded-full bg-flame px-1.5 text-xs font-bold text-[var(--flame-ink)]">{unmatched}</span>}<ChevronRight className="size-4 text-dim" /></Link>
        <Link href="/dashboard/settings/whatsapp-sim" className="flex h-16 items-center gap-3 px-4"><MessageCircle className="size-5 text-[#25D366]" /><span className="flex-1">{t.settings.whatsappSim}</span><ChevronRight className="size-4 text-dim" /></Link>
      </nav>

      <p className="mt-6 mb-2 text-xs uppercase tracking-[0.16em] text-dim">{t.ops.security}</p>
      <div className="divide-y divide-line rounded-3xl border border-line bg-raised">
        <button onClick={() => s.setPinLock(!s.pinLock)} role="switch" aria-checked={s.pinLock} className="flex min-h-16 w-full items-center gap-3 px-4 text-left">
          <Lock className="size-5 text-flame" />
          <span className="flex-1"><span className="block">{t.ops.pinLock}</span><span className="text-xs text-dim">{t.ops.pinLockBody}</span></span>
          <span className={`relative h-7 w-12 rounded-full transition-colors ${s.pinLock ? "bg-sukuma" : "bg-overlay"}`}><span className={`absolute top-1 size-5 rounded-full bg-white transition-all ${s.pinLock ? "left-6" : "left-1"}`} /></span>
        </button>
        {s.pinLock && <button onClick={s.lock} className="flex h-14 w-full items-center gap-3 px-4 text-left text-sm"><Lock className="size-4 text-dim" />{t.ops.lockNow}</button>}
        <Link href="/dashboard/zaidi" className="flex h-14 items-center gap-3 px-4 text-sm"><LayoutGrid className="size-4 text-dim" /><span className="flex-1">{t.ops.more}</span><ChevronRight className="size-4 text-dim" /></Link>
      </div>

      <button onClick={() => { s.resetDemo(); toast(t.settings.reset); }} className="mt-6 mb-8 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line text-sm text-dim">
        <RefreshCcw className="size-4" /> {t.settings.reset}
      </button>
    </div>
  );
}
